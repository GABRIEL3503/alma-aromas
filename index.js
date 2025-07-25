import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';  
import path from 'path';  // ✅ Solo una vez, en formato ES Modules
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs'; 

const app = express();
app.use(express.static('public'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Configurar multer para la carga de imágenes
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Solución para usar `__dirname` en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseRouter = express.Router();

let db = null; // Conexión global
let lastUsedTime = Date.now();

const PORT = process.env.PORT || 3030;

// Abrir la conexión global si no está abierta
function ensureDatabaseConnection() {
  if (!db) {
    db = new sqlite3.Database('./restaurant.db', (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
        return null; // Asegúrate de que maneje errores correctamente
      } else {
        console.log('Conexión a SQLite abierta.');
      }
    });
  }
  lastUsedTime = Date.now(); // Actualiza el tiempo de uso
  return db; // Siempre devuelve el objeto db
}

// Cerrar la conexión si no se usa después de un tiempo
function closeDatabaseIfIdle() {
  const IDLE_TIMEOUT = 60000; // Tiempo de inactividad (1 minuto)
  if (db && Date.now() - lastUsedTime > IDLE_TIMEOUT) {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos SQLite:', err.message);
      } else {
        console.log('Conexión a la base de datos SQLite cerrada por inactividad.');
      }
    });
    db = null; // Limpia la referencia
  }
}

// Verifica periódicamente si la conexión está inactiva
setInterval(closeDatabaseIfIdle, 30000); // Cada 30 segundos

// Manejo del cierre del servidor
process.on('SIGINT', () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos SQLite al detener el servidor:', err.message);
      } else {
        console.log('Conexión a la base de datos SQLite cerrada.');
      }
      process.exit(0);
    });
  } else {
    console.log('No hay conexión abierta a SQLite.');
    process.exit(0);
  }
});

// Asegúrate de abrir la conexión antes de ejecutar cualquier consulta
ensureDatabaseConnection();


import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

let menuVersion = 2; // O usa un timestamp inicial
function bumpMenuVersion() {
  menuVersion++;
  console.log(`🔄 Nueva versión del menú: ${menuVersion}`);
}
const JWT_SECRET = process.env.JWT_SECRET || "clave-unica-de-esta-app-alma-aromas"; 

// Hardcoded user for demonstration purposes
const hardcodedUser = {
  username: "alma-aromas",
  password: bcrypt.hashSync("alma-aromas_app", 8)  // Hashed password
};

// Endpoint de login
baseRouter.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === hardcodedUser.username && bcrypt.compareSync(password, hardcodedUser.password)) {
    
    // Generar el token con identificación de la app y tiempo de expiración
    const token = jwt.sign(
      { id: hardcodedUser.username, app: "alma-aromas" },
      JWT_SECRET,
    );

    res.status(200).send({ auth: true, token });
  } else {
    res.status(401).send({ auth: false, message: "Invalid credentials" });
  }
});

// CRUD Endpoints


baseRouter.post('/api/menu', upload.single('imagen'), async (req, res) => {
  const db = ensureDatabaseConnection();
  const {
    nombre,
    precio,
    precio_mayorista,
    descripcion,
    tipo,
    newSectionName,
    stock,
    parent_group
  } = req.body;

  let parsedStock = [];
  try {
    parsedStock = typeof stock === 'string' ? JSON.parse(stock) : stock;
    if (!Array.isArray(parsedStock)) throw new Error("Stock debe ser un array.");
  } catch (err) {
    return res.status(400).json({ error: "Formato inválido en el stock." });
  }

  const subelement = req.body.subelement === 'true';

  const precioEntero = parseInt(precio.toString().replace(/\./g, ""));
  const mayoristaEntero = parseInt(precio_mayorista?.toString().replace(/\./g, "") || "0");

  let img_url = '';
  if (req.file) {
    const imageFileName = `compressed-${Date.now()}.webp`;
    const compressedImagePath = path.join(__dirname, 'public/img/', imageFileName);

    try {
      await sharp(req.file.buffer)
        .resize({ width: 1200, height: 1200, fit: "inside" })
        .toFormat("webp", { quality: 85 })
        .toFile(compressedImagePath);

      img_url = `img/${imageFileName}`;
    } catch (error) {
      return res.status(500).json({ error: 'Error al procesar la imagen.' });
    }
  }

  if (tipo === 'new-section' && newSectionName) {
    const upperNewSectionName = newSectionName.trim().toUpperCase();
    db.get(
      'SELECT id FROM menu_sections WHERE UPPER(TRIM(nombre)) = ? AND parent_group = ?',
      [upperNewSectionName, parent_group],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (row) {
          return res.status(400).json({
            error: `La sección "${newSectionName}" ya existe en "${parent_group}".`
          });
        }

        db.get(
          'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM menu_sections WHERE parent_group = ?',
          [parent_group],
          (err, row) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            db.run(
              'INSERT INTO menu_sections (nombre, position, parent_group) VALUES (?, ?, ?)',
              [upperNewSectionName, row.nextPosition, parent_group],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                const newSectionId = this.lastID;
                insertMenuItem(
                  nombre,
                  precioEntero,
                  mayoristaEntero,
                  descripcion,
                  upperNewSectionName,
                  img_url,
                  subelement,
                  parsedStock,
                  parent_group,
                  res
                );
              }
            );
          }
        );
      }
    );
  } else {
    insertMenuItem(
      nombre,
      precioEntero,
      mayoristaEntero,
      descripcion,
      tipo.toUpperCase(),
      img_url,
      subelement,
      parsedStock,
      parent_group,
      res
    );
  }
});



function insertMenuItem(nombre, precio, precio_mayorista, descripcion, tipo, img_url, subelement, stock, parent_group, res) {
  const db = ensureDatabaseConnection();
  const precioEntero = parseInt(precio.toString().replace(/\./g, ''));
  const precioEnteroMayorista = parseInt(precio_mayorista.toString().replace(/\./g, '') || '0');

  db.run(
    'INSERT INTO menu_items (nombre, precio, precio_mayorista, descripcion, tipo, img_url, subelement, parent_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, precioEntero, precioEnteroMayorista, descripcion, tipo.toUpperCase(), img_url, subelement, parent_group || 'aromas'],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const itemId = this.lastID;

      const insertStockQuery = 'INSERT INTO stock_items (menu_item_id, aroma, cantidad) VALUES (?, ?, ?)';
      const stockPromises = stock.map(({ aroma, cantidad }) => {
        return new Promise((resolve, reject) => {
          db.run(insertStockQuery, [itemId, aroma, cantidad], function (err) {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      Promise.all(stockPromises)
        .then(() => {
          bumpMenuVersion();
          res.json({ id: itemId, stock });
        })
        .catch(err => res.status(500).json({ error: 'Error al insertar stock: ' + err.message }));
    }
  );
}

 // Obtener contraseña actual
baseRouter.get('/api/config/password/mayorista', (req, res) => {
  const db = ensureDatabaseConnection();
  db.get('SELECT value FROM config WHERE key = ?', ['mayorista_password'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ password: row?.value || '' });
  });
});

// Actualizar contraseña (solo admin validado)
baseRouter.post('/api/config/password/mayorista', (req, res) => {
  const db = ensureDatabaseConnection();
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Contraseña inválida' });
  }

  db.run(`
    INSERT INTO config (key, value)
    VALUES ('mayorista_password', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `, [password], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, password });
  });
});

  
baseRouter.get('/api/menu', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const query = `
  SELECT mi.*, ms.id as section_id
  FROM menu_items mi
  LEFT JOIN menu_sections ms 
    ON mi.tipo = ms.nombre 
    AND mi.parent_group = ms.parent_group
  ORDER BY ms.position, mi.position
`;
  db.all(query, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      res.json({ data: rows });
  });
});
baseRouter.put('/api/menu/order', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const items = req.body.items; // Array de objetos con {id, position}

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare('UPDATE menu_items SET position = ? WHERE id = ?');
    items.forEach(item => {
      stmt.run(item.position, item.id);
    });
    stmt.finalize();
    db.run('COMMIT', err => {
      if (err) {
        console.error("Error al ejecutar la transacción:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });
});

  
baseRouter.put('/api/menu/:id', upload.single('imagen'), async (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;
  const {
    nombre,
    precio,
    precio_mayorista,
    descripcion,
    tipo,
    stock,
    parent_group
  } = req.body;

  let parsedStock = [];
  try {
    parsedStock = typeof stock === "string" ? JSON.parse(stock) : stock;
    if (!Array.isArray(parsedStock)) parsedStock = [];
  } catch {
    parsedStock = [];
  }

  const precioEntero = precio ? parseInt(precio.toString().replace(/\./g, '')) : null;
  const precioMayoristaEntero = precio_mayorista ? parseInt(precio_mayorista.toString().replace(/\./g, '')) : 0;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get("SELECT img_url FROM menu_items WHERE id = ?", [id], async (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      const oldImgUrl = row?.img_url || null;
      let newImgUrl = oldImgUrl;

      if (req.file) {
        const imageFileName = `compressed-${Date.now()}.webp`;
        const compressedImagePath = path.join(__dirname, 'public/img/', imageFileName);

        try {
          await sharp(req.file.buffer)
            .resize({ width: 1200, height: 1200, fit: "inside" })
            .toFormat("webp", { quality: 85 })
            .toFile(compressedImagePath);

          newImgUrl = `img/${imageFileName}`;
        } catch (error) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Error al procesar la imagen." });
        }
      }

      const query = `
        UPDATE menu_items 
        SET 
          nombre = COALESCE(?, nombre),
          precio = COALESCE(?, precio),
          precio_mayorista = COALESCE(?, precio_mayorista),
          descripcion = COALESCE(?, descripcion),
          tipo = COALESCE(?, tipo),
          img_url = COALESCE(?, img_url),
          parent_group = COALESCE(?, parent_group)
        WHERE id = ?
      `;

      db.run(
        query,
        [nombre, precioEntero, precioMayoristaEntero, descripcion, tipo, newImgUrl, parent_group, id],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }

          if (this.changes === 0) {
            db.run("ROLLBACK");
            return res.status(404).json({ error: "Producto no encontrado." });
          }

          db.all("SELECT aroma FROM stock_items WHERE menu_item_id = ?", [id], (err, existingStock) => {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err.message });
            }

            const existingAromas = new Set(existingStock.map(({ aroma }) => aroma));

            const updateStockPromises = parsedStock.map(({ aroma, cantidad }) => {
              if (!aroma) return Promise.resolve(); // saltear sin aroma

              if (existingAromas.has(aroma)) {
                return new Promise((resolve, reject) => {
                  db.run(
                    "UPDATE stock_items SET cantidad = ? WHERE menu_item_id = ? AND aroma = ?",
                    [cantidad, id, aroma],
                    function (err) {
                      if (err) return reject(err);
                      resolve();
                    }
                  );
                });
              } else {
                return new Promise((resolve, reject) => {
                  db.run(
                    "INSERT INTO stock_items (menu_item_id, aroma, cantidad) VALUES (?, ?, ?)",
                    [id, aroma, cantidad],
                    function (err) {
                      if (err) return reject(err);
                      resolve();
                    }
                  );
                });
              }
            });

            // parsedStock.forEach(({ aroma, cantidad }) => {
            //   if (cantidad === 0) {
            //     db.run("DELETE FROM stock_items WHERE menu_item_id = ? AND aroma = ?", [id, aroma]);
            //   }
            // });

            Promise.all(updateStockPromises)
              .then(() => {
                db.run("COMMIT", (err) => {
                  if (err) return res.status(500).json({ error: err.message });

                  bumpMenuVersion();

                  if (req.file && oldImgUrl && newImgUrl !== oldImgUrl) {
                    const fullPath = path.join(__dirname, "public", oldImgUrl);
                    fs.unlink(fullPath, (err) => {
                      if (err) console.error("Error al eliminar la imagen antigua:", err);
                    });
                  }

                  res.json({ success: true, img_url: newImgUrl });
                });
              })
              .catch((err) => {
                db.run("ROLLBACK");
                res.status(500).json({ error: err.message });
              });
          });
        }
      );
    });
  });
});



baseRouter.delete('/api/menu/:id', (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;

  db.get('SELECT img_url FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    db.run('DELETE FROM stock_items WHERE menu_item_id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run('DELETE FROM menu_items WHERE id = ?', [id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Producto no encontrado." });
        }

        // ✅ Incrementar versión del menú
        bumpMenuVersion();

        // ✅ Verificar si hay imagen asociada antes de intentar eliminarla
        if (row.img_url) {
          const imagePath = path.join(__dirname, 'public', 'img', path.basename(row.img_url));

          fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (!err) {
              fs.unlink(imagePath, (err) => {
                if (err) {
                  console.error("❌ Error al eliminar la imagen:", err);
                  return res.status(500).json({ error: "Producto eliminado, pero la imagen no pudo ser eliminada." });
                }
                console.log(`✅ Imagen eliminada correctamente: ${imagePath}`);
                res.json({ deleted: true });
              });
            } else {
              console.warn("⚠️ La imagen no existe en la carpeta:", imagePath);
              res.json({ deleted: true });
            }
          });

        } else {
          res.json({ deleted: true });
        }
      });
    });
  });
});


 
  baseRouter.post('/api/announcements', upload.single('image'), async (req, res) => {
    const db = ensureDatabaseConnection();
    const { text, paragraph, state } = req.body;
    const BASE_URL = 'https://octopus-app.com.ar/alma-aromas';

    let newImageUrl = '';
    if (req.file) {
        const imageFileName = `compressed-${Date.now()}.webp`;
        const compressedImagePath = path.join(__dirname, 'public/img/', imageFileName);

        try {
            // 📌 Procesar imagen con Sharp (sin cambiar el alto)
            await sharp(req.file.buffer)
                .resize({ width: 800 })  // 🔹 Solo ajustamos el ancho, el alto se mantiene proporcional
                .toFormat('webp', { quality: 70 })  // 🔹 Convertimos a WEBP con calidad 70%
                .toFile(compressedImagePath);

            newImageUrl = `${BASE_URL}/img/${imageFileName}`;
        } catch (error) {
            console.error('Error al procesar la imagen con Sharp:', error);
            return res.status(500).json({ error: 'Error al procesar la imagen.' });
        }
    }

    const checkAnnouncementExists = 'SELECT id, image_url FROM announcements WHERE id = 1';

    db.get(checkAnnouncementExists, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el anuncio existente.' });
        }

        let query, params;
        const currentImageUrl = newImageUrl || (row ? row.image_url : '');

        if (row) {
            // 📌 Actualizar anuncio existente
            query = 'UPDATE announcements SET image_url = ?, text = ?, paragraph = ?, state = ? WHERE id = 1';
            params = [currentImageUrl, text, paragraph, state];
        } else {
            // 📌 Crear un nuevo anuncio
            query = 'INSERT INTO announcements (image_url, text, paragraph, state) VALUES (?, ?, ?, ?)';
            params = [currentImageUrl, text, paragraph, state];
        }

        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar el anuncio.' });
            }

            res.json({
                success: true,
                id: this.lastID,
                image_url: currentImageUrl
            });
        });
    });
});

// Ruta GET para obtener el anuncio activo
baseRouter.get('/api/announcements', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const getActiveAnnouncement = 'SELECT * FROM announcements WHERE state = \'true\' ORDER BY id DESC LIMIT 1';

  db.get(getActiveAnnouncement, [], (err, row) => {

    if (err) {
      console.error("Error al intentar obtener el anuncio activo de la base de datos:", err.message);

      res.status(500).json({ error: err.message });
      return;
    }

    res.json(row ? { success: true, announcement: row } : { success: false, message: 'No active announcement found' });
  });
});

baseRouter.put('/api/sections/order', (req, res) => {
  const db = ensureDatabaseConnection();
  let sections = req.body.sections;

  if (!sections || !Array.isArray(sections)) {
      console.error("❌ Error: 'sections' no es un array válido.");
      return res.status(400).json({ error: "Formato inválido. Se esperaba un array en 'sections'." });
  }

  console.log("🔄 Secciones recibidas para ordenar:", sections);

  db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 🔹 Asegurar que todas las secciones tengan una posición válida antes de actualizar
      db.run('UPDATE menu_sections SET position = (SELECT COALESCE(MAX(position), 0) + 1 FROM menu_sections) WHERE position IS NULL');

      const stmt = db.prepare('UPDATE menu_sections SET position = ? WHERE id = ?');

      // 🔹 Asignar nuevas posiciones únicas en base al array recibido
      sections.forEach((section, index) => {
          stmt.run([index + 1, section.id], function(err) {
              if (err) {
                  console.error(`❌ Error al actualizar sección ID ${section.id}:`, err);
              } else {
                  console.log(`✅ Sección actualizada correctamente - ID: ${section.id}, Nueva posición: ${index + 1}`);
              }
          });
      });

      stmt.finalize();
      db.run('COMMIT', err => {
          if (err) {
              console.error("❌ Error al ejecutar la transacción:", err);
              return res.status(500).json({ error: err.message });
          }
          bumpMenuVersion();

          console.log("✅ Transacción completada, secciones ordenadas correctamente.");
          res.json({ success: true });
      });
  });
});







baseRouter.get('/api/sections', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const query = 'SELECT id, nombre, position, parent_group FROM menu_sections ORDER BY position'; // 🔹 Asegurar orden correcto
  db.all(query, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      console.log("🔄 Secciones enviadas al frontend:", rows); // Debugging
      res.json({ data: rows });
  });
});

baseRouter.get('/api/menu/:id', (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;

  db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, item) => {
    if (err) {
      console.error("Error al obtener el ítem:", err);
      return res.status(500).json({ error: "Error en el servidor." });
    }

    if (!item) {
      return res.status(404).json({ error: "Ítem no encontrado." });
    }

    db.all(
      `SELECT id, aroma, cantidad 
       FROM stock_items 
       WHERE menu_item_id = ?`,
      [id],
      (err, stock) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Agrupar aromas como clave directa
        const aromas = {};
        stock.forEach(({ id, aroma, cantidad }) => {
          aromas[aroma] = { id, cantidad };
        });

        res.json({ ...item, stock: aromas });
      }
    );
  });
});

baseRouter.get('/api/menu/:id/talles', (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;

  db.all(
    `SELECT aroma, cantidad 
     FROM stock_items 
     WHERE menu_item_id = ? AND cantidad > 0`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!rows.length) {
        return res.json({ data: {}, message: "No hay stock disponible para este producto." });
      }

      const aromas = {};
      rows.forEach(({ aroma, cantidad }) => {
        aromas[aroma] = cantidad;
      });

      res.json({ data: aromas });
    }
  );
});


// PUT: Actualizar el precio de envío
baseRouter.put('/api/delivery', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const { price } = req.body;

  db.run('UPDATE delivery_settings SET price = ? WHERE id = 1', [price], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      // Si no existe el registro, crearlo
      db.run('INSERT INTO delivery_settings (price) VALUES (?)', [price], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
});

baseRouter.put("/api/menu/:id/visibility", (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;
  const { hidden } = req.body;

  const query = `UPDATE menu_items SET hidden = ? WHERE id = ?`;
  db.run(query, [hidden, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error updating visibility" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ success: true });
  });
});
// Obtener estado actual del catálogo
baseRouter.get('/api/catalog-status', (req, res) => {
  const db = ensureDatabaseConnection();
  db.get('SELECT paused FROM catalog_status WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ paused: !!row?.paused });
  });
});

// Actualizar estado (pausar o reactivar)
baseRouter.put('/api/catalog-status', (req, res) => {
  const db = ensureDatabaseConnection();
  const { paused } = req.body;

  db.run('UPDATE catalog_status SET paused = ? WHERE id = 1', [paused ? 1 : 0], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      db.run('INSERT INTO catalog_status (id, paused) VALUES (1, ?)', [paused ? 1 : 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
});


baseRouter.put('/api/delivery', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const { price } = req.body;
  if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
  }
  db.run('UPDATE delivery_settings SET price = ? WHERE id = 1', [price], function (err) {
      if (err) {
          console.error('Error updating delivery price:', err);
          res.status(500).json({ error: 'Failed to update delivery price' });
      } else if (this.changes === 0) {
          res.status(404).json({ error: 'Delivery price not found' });
      } else {
          res.json({ success: true });
      }
  });
});

baseRouter.get('/api/delivery', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  db.get('SELECT price FROM delivery_settings WHERE id = 1', [], (err, row) => {
      if (err) {
          console.error('Error fetching delivery price:', err);
          res.status(500).json({ error: 'Failed to fetch delivery price' });
      } else if (!row) {
          res.status(404).json({ error: 'Delivery price not found' });
      } else {
          res.json({ price: row.price });
      }
  });
});

baseRouter.post('/api/menu/:id/stock', (req, res) => {
  const db = ensureDatabaseConnection();
  const menuItemId = req.params.id;
  const { aroma, cantidad } = req.body;

  if (!aroma || cantidad === undefined) {
    return res.status(400).json({ error: "Faltan datos: aroma o cantidad." });
  }

  db.run(
    `INSERT INTO stock_items (menu_item_id, aroma, cantidad) VALUES (?, ?, ?)`,
    [menuItemId, aroma, cantidad],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: "Stock agregado correctamente." });
    }
  );
});

baseRouter.put("/api/stock/:id", (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;
  const { aroma, cantidad } = req.body;

  if (!aroma || cantidad === undefined) {
    return res.status(400).json({ error: "Faltan datos: aroma o cantidad." });
  }

  db.run(
    "UPDATE stock_items SET aroma = ?, cantidad = ? WHERE id = ?",
    [aroma, cantidad, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (cantidad === 0) {
        db.run("DELETE FROM stock_items WHERE id = ?", [id]);
      }

      res.json({ success: true, changes: this.changes });
    }
  );
});



baseRouter.delete('/api/stock/:id', (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;

  db.run('DELETE FROM stock_items WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Stock no encontrado." });
    }

    // Verificar si el producto se quedó sin stock
    db.get(
      'SELECT COUNT(*) AS total FROM stock_items WHERE menu_item_id = (SELECT menu_item_id FROM stock_items WHERE id = ?)',
      [id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (row.total === 0) {
          // Ocultar producto si no tiene stock
          db.run(
            'UPDATE menu_items SET hidden = 1 WHERE id = (SELECT menu_item_id FROM stock_items WHERE id = ?)',
            [id]
          );
        }

        res.json({ deleted: this.changes });
      }
    );
  });
});

baseRouter.get('/api/orders', (req, res) => {
  const db = ensureDatabaseConnection(); // Garantizar la conexión

  const query = `
  SELECT 
    order_id as id,
    CASE WHEN COUNT(*) = SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) 
         THEN 'paid' ELSE 'pending' END as status,
    MAX(details) as details,
    MAX(created_at) as created_at
  FROM order_items
  GROUP BY order_id
`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener pedidos:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


baseRouter.post('/api/orders', (req, res) => {
  const db = ensureDatabaseConnection();
  const { id, items } = req.body;

  if (!id || !items?.length) {
    return res.status(400).json({ success: false, error: 'Invalid order data' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT order_id FROM order_items WHERE order_id = ?', [id], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ success: false, error: err.message });
      }

      if (row) {
        db.run('ROLLBACK');
        return res.status(409).json({ success: false, error: 'Order already exists' });
      }

      const stmt = db.prepare(`
        INSERT INTO order_items 
        (order_id, product_id, aroma, quantity, price_at_time, status, details) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      try {
   items.forEach((item, index) => {
  const aroma = item.aroma || null;
  const details = index === 0 ? req.body.details || null : null;

  stmt.run([
    id,
    item.product_id,
    aroma,
    item.quantity,
    item.price_at_time,
    'pending',
    details
  ]);
});


        stmt.finalize();
        db.run('COMMIT', err => {
          if (err) {
            console.error('Error en COMMIT:', err);
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, id });
        });
      } catch (error) {
        console.error('Error al insertar items:', error);
        db.run('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });
});
// PUT: Actualizar el porcentaje de descuento por pago en efectivo o transferencia
baseRouter.put('/api/payment-fee', (req, res) => {
  const db = ensureDatabaseConnection();
  const { fee_percent, enabled } = req.body;

  db.run('UPDATE payment_settings SET fee_percent = ?, enabled = ? WHERE id = 1', [fee_percent, enabled], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      db.run('INSERT INTO payment_settings (id, fee_percent, enabled) VALUES (1, ?, ?)', [fee_percent, enabled], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
});


// GET: Obtener el porcentaje actual de descuento
baseRouter.get('/api/payment-fee', (req, res) => {
  const db = ensureDatabaseConnection();

  db.get('SELECT fee_percent, enabled FROM payment_settings WHERE id = 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      fee_percent: row?.fee_percent || 0,
      enabled: !!row?.enabled // importante para que frontend lo entienda como booleano
    });
  });
});


baseRouter.put('/api/orders/:id/status', async (req, res) => {
  const db = ensureDatabaseConnection();
  const { id } = req.params;

  try {
    await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', (err) => (err ? reject(err) : resolve())));

    // Paso 1: Verificar stock disponible en `stock_items` por aroma
    const stockCheck = await new Promise((resolve, reject) => {
      db.all(`
        SELECT oi.product_id, oi.aroma, oi.quantity, si.cantidad
        FROM order_items oi
        LEFT JOIN stock_items si 
          ON oi.product_id = si.menu_item_id 
  AND TRIM(oi.aroma) = TRIM(si.aroma)
        WHERE oi.order_id = ? AND oi.status = 'pending'
      `, [id], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Paso 2: Restar stock
    for (const item of stockCheck) {
      if (item.cantidad < item.quantity) {
        throw new Error(`Stock insuficiente para aroma "${item.aroma}"`);
      }

      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE stock_items 
          SET cantidad = cantidad - ?
          WHERE menu_item_id = ? AND aroma = ?`,
          [item.quantity, item.product_id, item.aroma],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    // Paso 3: Eliminar registros con cantidad = 0
    // await new Promise((resolve, reject) => {
    //   db.run(`
    //     DELETE FROM stock_items 
    //     WHERE cantidad = 0`,
    //     (err) => (err ? reject(err) : resolve())
    //   );
    // });

    // Paso 4: Ocultar productos sin stock
    // const stockCheckProducts = await new Promise((resolve, reject) => {
    //   db.all(`
    //     SELECT menu_item_id, COUNT(*) AS totalStock 
    //     FROM stock_items 
    //     GROUP BY menu_item_id`,
    //     (err, rows) => (err ? reject(err) : resolve(rows))
    //   );
    // });

    // for (const product of stockCheckProducts) {
    //   if (product.totalStock === 0) {
    //     await new Promise((resolve, reject) => {
    //       db.run(
    //         `UPDATE menu_items SET hidden = 1 WHERE id = ?`,
    //         [product.menu_item_id],
    //         (err) => (err ? reject(err) : resolve())
    //       );
    //     });
    //   }
    // }

    // Paso 5: Marcar pedido como pagado
    await new Promise((resolve, reject) => {
      db.run('UPDATE order_items SET status = ? WHERE order_id = ?', ['paid', id], (err) =>
        err ? reject(err) : resolve()
      );
    });

    await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));

    res.json({ success: true });

  } catch (error) {
    await new Promise((resolve, reject) => db.run('ROLLBACK', (err) => (err ? reject(err) : resolve())));
    res.status(500).json({ error: error.message });
  }
});

baseRouter.get('/api/config/minimo-mayorista', (req, res) => {
  const db = ensureDatabaseConnection();
  db.get('SELECT value FROM config WHERE key = ?', ['minimo_mayorista'], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const value = parseInt(row?.value || '40000', 10);
    res.json({ success: true, value });
  });
});
baseRouter.post('/api/config/minimo-mayorista', (req, res) => {
  const db = ensureDatabaseConnection();
  const { value } = req.body;
  if (!value || isNaN(value)) {
    return res.status(400).json({ success: false, error: 'Valor inválido' });
  }

  db.run(
    'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
    ['minimo_mayorista', String(value)],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});
baseRouter.post('/api/stock/check', (req, res) => {
  const db = ensureDatabaseConnection();
  const items = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Formato inválido. Se esperaba un array.' });
  }

  const insufficient = [];

  let checked = 0;
  const total = items.length;

  if (total === 0) {
    return res.json({ success: true, message: 'Carrito vacío' });
  }

  items.forEach(({ product_id, aroma, quantity }) => {
    db.get(
      'SELECT cantidad FROM stock_items WHERE menu_item_id = ? AND aroma = ?',
      [product_id, aroma],
      (err, row) => {
        checked++;
        if (err) {
          console.error(err.message);
          insufficient.push({ product_id, aroma, error: 'Error al consultar stock' });
        } else {
          const disponible = row ? row.cantidad : 0;
          if (disponible < quantity) {
            insufficient.push({
              product_id,
              aroma,
              available: disponible,
              requested: quantity
            });
          }
        }

        if (checked === total) {
          if (insufficient.length > 0) {
            res.json({ success: false, insufficient });
          } else {
            res.json({ success: true, message: 'Stock suficiente' });
          }
        }
      }
    );
  });
});


import os from 'os';

// Endpoint para monitorear el uso de memoria
baseRouter.get('/monitor/memory', (req, res) => {

  const memoryData = process.memoryUsage();
  const totalMemory = os.totalmem();

  // Devolver la información del uso de memoria
  res.json({
    rss: `${(memoryData.rss / 1024 / 1024).toFixed(2)} MB`, // Memoria total asignada al proceso
    heapTotal: `${(memoryData.heapTotal / 1024 / 1024).toFixed(2)} MB`, // Heap total disponible
    heapUsed: `${(memoryData.heapUsed / 1024 / 1024).toFixed(2)} MB`, // Heap realmente usado
    external: `${(memoryData.external / 1024 / 1024).toFixed(2)} MB`, // Memoria usada por módulos nativos
    totalSystemMemory: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`, // Memoria total del sistema
  });
});



app.use('/alma-aromas', baseRouter);

// Luego sirve el contenido estático
app.use('/alma-aromas', express.static(path.join(__dirname, 'public')));

// Finalmente, para todas las demás rutas bajo '/inventario', sirve el index.html
app.get('/alma-aromas/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});


baseRouter.get('/api/menuVersion', (req, res) => {
    res.json({ version: menuVersion });
});
// app.get('/api/menuVersion', (req, res) => {
//   res.json({ version: menuVersion });
// });
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

