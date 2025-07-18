
let menuItemsPromise = null;
let menuSectionsPromise = null;
window.onscroll = function () {
  scrollFunction();
};



function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

// En ambos archivos (script.js y scriptadmin.js)
function formatDateArgentina(date, includeTime = true) {
  const options = {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }

  const formatted = new Date(date).toLocaleString('es-AR', options);
  return includeTime ? formatted : formatted.split(',')[0];
}

const PARENT_GROUPS = [
  {
    id: 'aromas',
    title: 'AROMAS',
    description: '• Sandra Marzzan •'
  },
  {
    id: 'sahumerios',
    title: 'SAHUMERIOS',
    description: '• Aromanza | Sagrada Madre •'
  },
  
];
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatPrice(value) {
  // Ya sabemos que value es un número entero desde la BD
  return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function checkAuthentication() {
  // 🔐 Validar expiración de sesión mayorista
  const expireAt = parseInt(localStorage.getItem('mayorista_expire_at'), 10);
  if (localStorage.getItem('mayorista_access') === 'true') {
    if (!expireAt || Date.now() > expireAt) {
      localStorage.removeItem('mayorista_access');
      localStorage.removeItem('mayorista_expire_at');
    }
  }

  const token = localStorage.getItem('jwt_alma-aromas');
  const isMayorista = localStorage.getItem('mayorista_access') === 'true';
  const isAdmin = !!token;
  const cartButton = document.getElementById('cart-button');
  const parallax = document.querySelector('.parallax-container');

  if (isAdmin) {
    document.querySelectorAll('.auth-required').forEach(elem => elem.style.display = 'inline-block');
    document.querySelector('.container-botones').style.display = '';
    if (parallax) parallax.style.display = 'none';
    if (cartButton) cartButton.style.display = 'none';
  } else {
    document.querySelectorAll('.auth-required').forEach(elem => elem.style.display = 'none');
    document.querySelector('.container-botones').style.display = 'none';
    if (parallax) parallax.style.display = '';
    if (cartButton) cartButton.style.display = 'flex';
  }

  if (isAdmin || isMayorista) {
    document.querySelectorAll('.item-price-mayorista').forEach(el => el.style.display = 'block');
  }

  if (isMayorista && !isAdmin) {
    document.querySelectorAll('.item-price').forEach(el => {
      const priceText = el.firstChild;
      if (priceText && priceText.nodeType === Node.TEXT_NODE) {
        priceText.textContent = '';
      }
    });
  }

  const trigger = document.getElementById('btn-mayorista-toggle');
  if (trigger && isMayorista) {
    trigger.textContent = 'Estás viendo precios como mayorista';
    trigger.style.cursor = 'pointer';
    trigger.removeAttribute('href');
  }
  const toggleBtn = document.getElementById('btn-mayorista-toggle');
if (toggleBtn) {
  toggleBtn.style.display = isAdmin ? 'none' : '';
}

}




// Función para actualizar la página
function updateContent() {
  window.location.reload();
}


// Initialize MercadoPago with public key
const mp = new MercadoPago('APP_USR-109a0809-067e-4724-b997-c0d129201788', {
  locale: 'es-AR'
});

// Function to create payment preference and redirect to MercadoPago checkout
function handlePayment(totalAmount) {
  fetch('https://octopus-app.com.ar/alma-aromas/create_preference', {

    // fetch('http://localhost:3001/create_preference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Total Compra',  // Título del pago
      quantity: 1,            // Cantidad de productos (puede ajustarse)
      price: totalAmount      // El total capturado del carrito
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(preference => {
      // Asegurarse de que el SDK de MercadoPago esté cargado en el cliente
      if (typeof mp !== 'undefined') {
        // Redireccionar al checkout de MercadoPago con el ID de la preferencia
        mp.checkout({
          preference: {
            id: preference.id  // El ID de la preferencia creada
          },
          autoOpen: true  // Abrir automáticamente el checkout
        });
      } else {
        console.error("MercadoPago SDK not loaded.");
      }
    })
    .catch(error => {
      console.error('Error creating payment preference:', error);
    });
}

function toggleVisibility(item, button) {
  const itemId = item.dataset.id;
  const hidden = item.style.opacity === '0.3' ? 0 : 1;  // Determinar si está oculto o visible

  // Enviar el cambio al servidor
  fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${itemId}/visibility`, {

    // fetch(`http://localhost:3001/api/menu/${itemId}/visibility`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hidden })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (hidden) {
          item.style.opacity = '0.3';  // Cambiar opacidad a oculto
          button.textContent = 'Mostrar';  // Cambiar texto a "Mostrar"
        } else {
          item.style.opacity = '1';  // Cambiar opacidad a visible
          button.textContent = 'Ocultar';  // Cambiar texto a "Ocultar"
        }
      }
    })
    .catch(err => console.error('Error updating visibility:', err));
}

document.addEventListener("DOMContentLoaded", function () {

  checkAuthentication();

  // const button = document.createElement('button');
  // button.innerHTML = '↻ Actualizar';
  // button.className = 'update-button auth-required';
  // button.addEventListener('click', updateContent);
  // document.body.appendChild(button);

  // Añadir un evento click al botón "Iniciar Sesión"
  // Añadir un evento click al botón "Iniciar Sesión"
  document.getElementById('login-button').addEventListener('click', function () {
    Swal.fire({
      title: 'Iniciar Sesión',
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Usuario">' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Contraseña">',
      focusConfirm: false,
      preConfirm: () => {
        return {
          username: document.getElementById('swal-username').value,
          password: document.getElementById('swal-password').value
        };
      }
    }).then((result) => {  // Asegúrate de que este bloque esté dentro de la llamada a Swal.fire
      if (result.isConfirmed) {
        // Enviar estas credenciales al servidor

        fetch('https://octopus-app.com.ar/alma-aromas/api/auth/login', {
          // fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        })
          .then(response => response.json())
          .then(data => {
            if (data.auth) {
              localStorage.setItem('jwt_alma-aromas', data.token);
              window.location.reload();  // Recargar la página

            } else {
              console.log('Credenciales inválidas');
            }
          });
      }
    });
  });
  function loadMenuItems() {
    const localVersion = localStorage.getItem('menuVersion');
    const expiry = localStorage.getItem('menuDataExpiry');
    const isExpired = !expiry || Date.now() > parseInt(expiry);
  
    return fetch('https://octopus-app.com.ar/alma-aromas/api/menuVersion')
      .then(response => response.json())
      .then(serverVersionData => {
        const serverVersion = serverVersionData.version;
  
        if (localVersion !== serverVersion || isExpired) {
          return fetchMenuDataFromServer(); // Trae desde backend y actualiza localStorage
        } else {
          const menuData = JSON.parse(localStorage.getItem('menuData'));
          renderMenuItems(menuData);
          const token = localStorage.getItem('jwt_alma-aromas');
          if (token) {
            makeMenuSortable();
          }
        }
      });
  }
  // Cierre de loadMenuItems()

  function fetchMenuDataFromServer() {
    return fetch('https://octopus-app.com.ar/alma-aromas/api/menu')

      // return fetch('http://localhost:3001/api/menu')
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('menuVersion', data.version);
localStorage.setItem('menuData', JSON.stringify(data.data));
localStorage.setItem('menuDataExpiry', Date.now() + 3600 * 1000); // Expira en 1 hora

        renderMenuItems(data.data);
        const token = localStorage.getItem('jwt_alma-aromas');
        if (token) {
          makeMenuSortable();
        }
      });
  }

  function makeMenuSortable() {
    const menuGroups = document.querySelectorAll('.menu-group');
    const menuSections = document.querySelectorAll('.menu-section');
    const container = document.querySelector('.container');
    const containerBotones = document.querySelector('.container-botones');
    let sortableEnabled = false;

    let switchButton = document.querySelector('.switch-button');
    if (!switchButton) {
      switchButton = document.createElement('button');
      switchButton.classList.add('switch-button', 'auth-required');

      const icon = document.createElement('img');
      icon.src = 'img/touch_app_24dp_108DEE_FILL0_wght400_GRAD0_opsz24.png';
      icon.alt = 'Icono';
      icon.classList.add('button-icon');
      switchButton.appendChild(icon);
      switchButton.appendChild(document.createTextNode('Habilitar arrastre'));

      if (containerBotones) {
        containerBotones.appendChild(switchButton);
      }
    }
    let ordersButton = document.querySelector('.orders-button');
    if (!ordersButton) {
      ordersButton = document.createElement('button');
      ordersButton.classList.add('orders-button', 'auth-required');

      const icon = document.createElement('img');
      icon.src = 'img/shopping_cart_28dp_007BFF_FILL0_wght400_GRAD0_opsz24.png'; // Reemplaza con un ícono de pedidos si lo deseas
      icon.alt = 'Ícono de Pedidos';
      icon.classList.add('button-icon');
      ordersButton.appendChild(icon);

      ordersButton.appendChild(document.createTextNode('Pedidos'));

      // Agregar evento de clic para redirigir
      ordersButton.addEventListener('click', () => {
        window.location.href = '/alma-aromas/admin.html';
      });

      if (containerBotones) {
        containerBotones.appendChild(ordersButton);
      }
    }
    switchButton.addEventListener('click', toggleSortable);

    function toggleSortable() {
      sortableEnabled = !sortableEnabled;
      updateButtonState();
      resetSortableInstances();

      if (sortableEnabled) {
        enableSortable();
      }
    }

    function updateButtonState() {
      switchButton.childNodes[1].textContent = sortableEnabled ? 'Deshabilitar arrastre' : 'Habilitar arrastre';
    }

    function resetSortableInstances() {
      menuGroups.forEach(menuGroup => {
        if (menuGroup.sortableInstance) {
          menuGroup.sortableInstance.destroy();
          delete menuGroup.sortableInstance;
        }
      });

      menuSections.forEach(menuSection => {
        if (menuSection.sortableInstance) {
          menuSection.sortableInstance.destroy();
          delete menuSection.sortableInstance;
        }
      });

      if (container.sortableInstance) {
        container.sortableInstance.destroy();
        delete container.sortableInstance;
      }
    }

    function enableSortable() {
      // Permitir arrastrar los grupos completos dentro del contenedor principal
      if (!container.sortableInstance) {
        container.sortableInstance = new Sortable(container, {
          animation: 150,
          handle: '.group-title', // Drag handle para grupos
          ghostClass: 'sortable-ghost',
          scroll: true, // 🔹 Activa auto-scroll
          scrollSensitivity: 100, // 🔹 Ajusta la sensibilidad del scroll
          scrollSpeed: 10, // 🔹 Controla la velocidad del scroll
          group: "groups",
          onStart: evt => {
            if (!sortableEnabled) {
              evt.preventDefault();
            }
          },
          onEnd: evt => handleOnEnd(evt, container, 'groups')
        });
      }

      // Hacer arrastrables las secciones dentro de cada grupo
      menuGroups.forEach(menuGroup => {
        if (!menuGroup.sortableInstance) {
          menuGroup.sortableInstance = new Sortable(menuGroup, {
            animation: 150,
            handle: '.section-title', // Drag handle para secciones dentro de los grupos
            ghostClass: 'sortable-ghost',
            scroll: true, // 🔹 Activa auto-scroll
            scrollSensitivity: 100, // 🔹 Ajusta la sensibilidad
            scrollSpeed: 10, // 🔹 Controla la velocidad
            group: "sections",
            onStart: evt => {
              if (!sortableEnabled) {
                evt.preventDefault();
              }
            },
            onEnd: evt => handleOnEnd(evt, menuGroup, 'sections')
          });
        }
      });

      // Hacer arrastrables los elementos dentro de cada sección
      menuSections.forEach(menuSection => {
        if (!menuSection.sortableInstance) {
          menuSection.sortableInstance = new Sortable(menuSection, {
            animation: 150,
            handle: '.item-content', // Drag handle para items
            ghostClass: 'sortable-ghost',
            scroll: true, // 🔹 Activa auto-scroll
            scrollSensitivity: 100, // 🔹 Ajusta la sensibilidad
            scrollSpeed: 10, // 🔹 Controla la velocidad
            group: "items",
            onStart: evt => {
              if (!sortableEnabled) {
                evt.preventDefault();
              }
            },
            onEnd: evt => handleOnEnd(evt, menuSection, 'items')
          });
        }
      });
    }


    function handleOnEnd(evt, element, type) {
      if (!sortableEnabled) return;

      let items = Array.from(element.children).map((item, index) => ({
        id: item.dataset.id ? item.dataset.id.trim() : null, // 🔹 Asegurar que id es válido
        position: index
      }));

      // 🔹 Filtrar elementos sin id válido (null, undefined o vacío)
      items = items.filter(item => item.id && item.id !== "null");

      let apiEndpoint = '';
      let bodyData = {};

      if (type === 'groups') {
        apiEndpoint = `https://octopus-app.com.ar/alma-aromas/api/groups/order`;
        bodyData = { groups: items };
      } else if (type === 'sections') {
        apiEndpoint = `https://octopus-app.com.ar/alma-aromas/api/sections/order`;
        bodyData = { sections: items }; // 🔹 Asegurar que la clave es "sections"
      } else if (type === 'items') {
        apiEndpoint = `https://octopus-app.com.ar/alma-aromas/api/menu/order`;
        bodyData = { items: items };
      } else {
        console.error(`Tipo inválido: ${type}. Endpoint no encontrado.`);
        return;
      }

      // 🔍 REGISTRO PARA DEPURACIÓN
      console.log("Enviando a API (corregido):", JSON.stringify(bodyData)); // 🔹 Verifica la nueva salida

      fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_alma-aromas')}`
        },
        body: JSON.stringify(bodyData) // 🔹 Asegurar que el body tiene el formato correcto
      })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`HTTP ${response.status}: ${text}`);
            });
          }
          return response.json();
        })
        .then(data => console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} ordenado correctamente`))
        .catch(error => {
          console.error(`Error al ordenar ${type}:`, error);
        });
    }


  }

  makeMenuSortable();


  //  evento edición del precio de envío
  const editDeliveryPriceButton = document.getElementById('edit-delivery-price-button');
  if (editDeliveryPriceButton) {

    editDeliveryPriceButton.addEventListener('click', function () {
      // Obtener el precio actual desde la API
      fetch('https://octopus-app.com.ar/alma-aromas/api/delivery')
        // fetch('http://localhost/pedidos/api/delivery')

        .then(response => response.json())
        .then(data => {
          const currentPrice = data.price || 0;

          // Mostrar popup para editar el precio
          Swal.fire({
            title: 'Editar Precio de Envío',
            input: 'text',
            inputValue: currentPrice.toFixed(2),
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: (newPrice) => {
              // Validar que el nuevo precio sea un número válido
              if (isNaN(newPrice) || parseFloat(newPrice) < 0) {
                Swal.showValidationMessage('Por favor, ingresa un precio válido');
                return false;
              }

              // Enviar el nuevo precio al backend
              return fetch('https://octopus-app.com.ar/alma-aromas/api/delivery', {

                // return fetch('http://localhost:3001/api/delivery', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('alma-aromas')}`
                },
                body: JSON.stringify({ price: parseFloat(newPrice) })
              })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    Swal.fire('Guardado', 'El precio de envío ha sido actualizado', 'success');
                  } else {
                    Swal.fire('Error', 'No se pudo actualizar el precio de envío', 'error');
                  }
                });
            }
          });
        });
    });
    // Botón para pausar catálogo
const toggleCatalogButton = document.createElement('button');
toggleCatalogButton.id = 'toggle-catalog-button';
toggleCatalogButton.classList.add('auth-required');
toggleCatalogButton.textContent = 'Pausar Catálogo';

editDeliveryPriceButton.parentElement.appendChild(toggleCatalogButton);

let isPaused = false;

function updateToggleText() {
  toggleCatalogButton.textContent = isPaused ? 'Reanudar Catálogo' : 'Pausar Catálogo';
}

// Obtener estado actual
fetch('https://octopus-app.com.ar/alma-aromas/api/catalog-status')
  .then(res => res.json())
  .then(data => {
    isPaused = !!data.paused;
    updateToggleText();
  });

toggleCatalogButton.addEventListener('click', () => {
  isPaused = !isPaused;
  fetch('https://octopus-app.com.ar/alma-aromas/api/catalog-status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('alma-aromas')}`
    },
    body: JSON.stringify({ paused: isPaused })
  })
    .then(res => res.json())
    .then(() => {
      updateToggleText();
      Swal.fire(
        'Catálogo ' + (isPaused ? 'pausado' : 'reactivado'),
        isPaused ? 'Los usuarios no podrán agregar productos.' : 'Todo volvió a la normalidad.',
        'info'
      );
    })
    .catch(() => {
      Swal.fire('Error', 'No se pudo cambiar el estado del catálogo', 'error');
    });
});


const generalDiscountBtn = document.createElement('button');
generalDiscountBtn.id = 'edit-general-discount-button';
generalDiscountBtn.classList.add('auth-required');
generalDiscountBtn.textContent = 'Editar Descuento General';

editDeliveryPriceButton.parentElement.appendChild(generalDiscountBtn);

generalDiscountBtn.addEventListener('click', () => {
  fetch('https://octopus-app.com.ar/alma-aromas/api/payment-fee')
    .then(res => res.json())
    .then(({ fee_percent, enabled }) => {
      Swal.fire({
        title: 'Descuento General',
        html: `
          <input id="swal-input1" class="swal2-input" placeholder="Porcentaje" value="${fee_percent}">
          <div style="margin-top:10px;">
            <label><input type="checkbox" id="swal-enabled" ${enabled ? 'checked' : ''}> Activar descuento</label>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const percent = parseFloat(document.getElementById('swal-input1').value);
          const isEnabled = document.getElementById('swal-enabled').checked;

          if (isNaN(percent) || percent < 0 || percent > 100) {
            Swal.showValidationMessage('Porcentaje inválido (0–100)');
            return false;
          }

          return fetch('https://octopus-app.com.ar/alma-aromas//api/payment-fee', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('alma-aromas')}`
            },
            body: JSON.stringify({ fee_percent: percent, enabled: isEnabled })
          })
            .then(r => r.json())
            .then(r => {
              if (!r.success) throw new Error();
              Swal.fire('Actualizado', 'Descuento general guardado', 'success');
            })
            .catch(() => {
              Swal.fire('Error', 'No se pudo guardar', 'error');
            });
        }
      });
    });
});


  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function renderMenuItems(menuData) {
    const container = document.querySelector('.container');
  
    container.querySelectorAll('.menu-section').forEach(section => section.remove());
    container.querySelectorAll('.menu-group').forEach(group => group.remove());
  
    const isAuthenticated = !!localStorage.getItem('jwt_alma-aromas');
    const lastCreatedId = localStorage.getItem('lastCreatedItemId');
  
    const parentContainers = PARENT_GROUPS.reduce((containers, group) => {
      const groupContainer = document.createElement('div');
      groupContainer.className = 'menu-group';
      groupContainer.setAttribute('data-group', group.id);
      const hasParallax = group.id === 'aromas' || group.id === 'sahumerios';
      const parallaxHTML = hasParallax ? `
          <div class="parallax-container">
              <img src="img/Paralax ${group.id === 'aromas' ? '1' : '2'} frase.webp">
              <h3 class="parallax-text"></h3>
          </div>
        ` : '';
      groupContainer.innerHTML = `
        <span class="group-header">
            ${parallaxHTML}
            <h1 class="group-title">${group.title}</h1>
            <p class="group-description">${group.description}</p>
        </span>
        `;

      container.appendChild(groupContainer);
      containers[group.id] = groupContainer;
      return containers;
    }, {});
 const sections = {};

// 🔥 Agrupar por sección primero
const groupedItems = {};
menuData.forEach(item => {
  let parentGroup = item.parent_group;
  if (!parentGroup || !parentContainers[parentGroup]) {
    console.warn(`Grupo inválido "${parentGroup}". Usando fallback 'aromas'.`, item);
    parentGroup = 'aromas';
  }

  const sectionKey = `${parentGroup}-${item.tipo}`;
  if (!groupedItems[sectionKey]) {
    groupedItems[sectionKey] = {
      parentGroup,
      tipo: item.tipo,
      section_id: item.section_id,
      items: []
    };
  }
  groupedItems[sectionKey].items.push(item);
});

// 🔁 Renderizar ordenadamente por grupo/tipo
Object.entries(groupedItems).forEach(([sectionKey, sectionData]) => {
  const { parentGroup, tipo, section_id, items } = sectionData;

  // 🔄 Crear section si no existe aún
  if (!sections[sectionKey]) {
    const menuSection = document.createElement('div');
    menuSection.className = 'menu-section';
    menuSection.setAttribute('data-id', section_id);
    menuSection.setAttribute('data-type', tipo);
    menuSection.innerHTML = `
      <h2 class="section-title">
        <span>${capitalizeFirstLetter(tipo.toLowerCase())}</span>
      </h2>
    `;
    sections[sectionKey] = menuSection;
    parentContainers[parentGroup].appendChild(menuSection);
  }

  const section = sections[sectionKey];

  // ✅ Ordenar los ítems por posición antes de agregarlos
  items.sort((a, b) => a.position - b.position);

  items.forEach(item => {
    const newItem = createMenuItem(item);
    newItem.dataset.id = item.id;
    newItem.dataset.hidden = item.hidden;

    const menuItem = newItem.querySelector('.menu-item');

    const buttonsContainer = document.createElement('span');
    buttonsContainer.className = 'admin-buttons-container';

    const editButton = menuItem.querySelector('.edit-button');
    if (editButton) buttonsContainer.appendChild(editButton);

    const hideShowButton = document.createElement('button');
    hideShowButton.className = 'hide-show-button auth-required';
    hideShowButton.textContent = item.hidden ? 'Mostrar' : 'Ocultar';
    hideShowButton.addEventListener('click', () => toggleVisibility(newItem, hideShowButton));
    buttonsContainer.appendChild(hideShowButton);

    menuItem.appendChild(buttonsContainer);

    if (item.hidden) {
      newItem.style.display = isAuthenticated ? 'block' : 'none';
      newItem.style.opacity = isAuthenticated ? '0.3' : '1';
    }

    // ⛔️ InsertBefore invertía el orden original
    section.appendChild(newItem); // ✅ Solución orden visual correcta
  });
});

// ✅ Mantener marcado visual del último ítem
const allSections = document.querySelectorAll('.menu-section');
const lastSection = allSections[allSections.length - 1];

if (lastSection) {
  const items = lastSection.querySelectorAll('.menu-item');
  if (items.length > 0) {
    items.forEach(el => el.classList.remove('ultimo-item'));
    items[items.length - 1].classList.add('ultimo-item');
  }
}


    checkAuthentication();
    const tipo = localStorage.getItem('lastCreatedItemTipo');
    const grupo = localStorage.getItem('lastCreatedItemGrupo');
    
    if (tipo && grupo) {
      const targetSelector = `.menu-group[data-group="${grupo}"] .menu-section[data-type="${tipo}"]`;
    
      const waitForOffset = (callback) => {
        const section = document.querySelector(targetSelector);
        if (section && section.offsetTop > 0) {
          window.scrollTo({
            top: section.offsetTop - 100,
            behavior: 'auto'
          });
          localStorage.removeItem('lastCreatedItemTipo');
          localStorage.removeItem('lastCreatedItemGrupo');
          if (callback) callback();
        } else {
          requestAnimationFrame(() => waitForOffset(callback));
        }
      };
    
      waitForOffset(() => {
        if (typeof AOS !== 'undefined') {
          AOS.refresh(); // ⚡ Solo después del scroll
        }
      });
    }
    
  } 
  


  function loadAromasForItem(itemId) {
    fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${itemId}/talles`)
      .then(response => response.json())
      .then(aromaData => {
        const aromaSelect = document.querySelector(`.menu-item[data-id="${itemId}"] .aroma-select`);
        if (!aromaSelect || !aromaData.data) return;
  
        aromaSelect.innerHTML = '<option value="" disabled selected>Aroma</option>';
  
        Object.entries(aromaData.data).forEach(([aroma, cantidad]) => {
          if (cantidad > 0) {
            const option = document.createElement('option');
            option.value = aroma;
            option.textContent = aroma;
            aromaSelect.appendChild(option);
          }
        });
      })
      .catch(err => console.error('Error cargando aromas:', err));
  }
  
  

function createMenuItem(item) {
  const imageUrl = item.img_url || '';
  const imgTag = imageUrl ? `<img src="${imageUrl}" alt="${item.nombre}" onerror="this.onerror=null; this.src='';" />` : '';

  const hasPrecio = typeof item.precio === 'number' && !isNaN(item.precio);

  const priceAndButton = `
    <div class="price-button-container">
      ${hasPrecio ? `
        <span class="item-price ${item.subelement ? 'with-description' : ''}">$${formatPrice(item.precio)}</span>
        ${item.precio_mayorista ? `<div class="item-price-mayorista">$${formatPrice(item.precio_mayorista)}</div>` : ''}
      ` : ''}
${hasPrecio ? `<button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.nombre}" data-price="${item.precio}">+</button>` : ''}
    </div>
  `;

  const contenedorItems = document.createElement('span');
  contenedorItems.className = 'contenedor-items';

  const newItem = document.createElement('div');
  newItem.className = 'menu-item';
  newItem.dataset.id = item.id;

  newItem.innerHTML = `
    <div class="item-header">${imgTag}</div>
    <div class="item-content">
      <h3 class="item-title ${item.subelement ? 'porciones-title' : ''}">${item.nombre}</h3>
      ${priceAndButton}
      <p class="item-description">${item.descripcion || ''}</p>
    </div>
  `;

  const editButton = document.createElement('button');
  editButton.classList.add('edit-button', 'auth-required');
  editButton.textContent = 'Editar';
  newItem.appendChild(editButton);

  const aromaWrapper = document.createElement('div');
  aromaWrapper.className = 'aroma-wrapper';

  const aromaDropdown = document.createElement('select');
  aromaDropdown.className = 'aroma-select';
  aromaDropdown.innerHTML = `<option value="" disabled selected>Aroma</option>`;

  fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${item.id}/talles`)
    .then(response => response.json())
    .then(stockData => {
      const stock = stockData.data || {};
      Object.entries(stock).forEach(([aroma, cantidad]) => {
        if (cantidad > 0) {
          const option = document.createElement('option');
          option.value = aroma;
          option.textContent = aroma;
          aromaDropdown.appendChild(option);
        }
      });

      aromaWrapper.appendChild(aromaDropdown);
      newItem.querySelector('.item-content').appendChild(aromaWrapper);
    })
    .catch(err => {
      console.error('Error fetching stock data:', err);
    });

  contenedorItems.appendChild(newItem);
  return contenedorItems;
}


  // Crear el overlay si no existe
  let overlay = document.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }

  // Evento para abrir el popup del carrito al hacer clic en el botón flotante
  document.getElementById('cart-button').addEventListener('click', function () {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};

    if (Object.keys(cart).length === 0) {
      // Si el carrito está vacío, mostrar un popup básico sin overlay
      const emptyCartPopup = document.createElement('div');
      emptyCartPopup.classList.add('cart-popup');
      emptyCartPopup.innerHTML = `
          <div class="cart-popup-content">
              <span class="close"><button class="close-cart-btn">X</button></span>
              <h2>Pedido</h2>
              <p>Tu carrito está vacío</p>
              <div class="btn-popup">
                  <button class="continue-shopping-btn">Seguir Comprando</button>
              </div>
          </div>
      `;
      document.body.appendChild(emptyCartPopup);

      // Eventos para cerrar el popup
      document.querySelector('.close-cart-btn').addEventListener('click', () => {
        document.body.removeChild(emptyCartPopup);
      });
      document.querySelector('.continue-shopping-btn').addEventListener('click', () => {
        document.body.removeChild(emptyCartPopup);
      });

    } else {
      // Si el carrito tiene productos, llamar a showCartPopup y aplicar overlay
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
      showCartPopup();
    }
  });

  function confirmOrder(formattedDate) {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const orderNumber = Math.floor(Math.random() * 10000);
    const orderId = `P${orderNumber}`;
    const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked')?.value || 'pickup';
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'No especificado';
  
    let orderDetails = ` *Hola, quiero realizar mi pedido.*\n\n`;
    orderDetails += `🛒 *Nro:* *${orderId}*\n`;
    orderDetails += `📅 ${formattedDate}\n`;
    orderDetails += `🛵 *Envío:* ${deliveryMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro en local'}\n`;
  
    let address = '';
    if (deliveryMethod === 'delivery') {
      address = document.getElementById('delivery-address')?.value.trim();
      if (!address) {
        Swal.fire('Error', 'Debes ingresar una dirección de entrega.', 'error');
        return;
      }
      orderDetails += `🏠 *Dirección:* ${address}\n`;
    }
  
    orderDetails += `💳 *Pago:* ${paymentMethod}\n\n`;
    orderDetails += `*Productos:*\n`;
  
    let total = 0;
    const items = Object.entries(cart).map(([key, product]) => {
      if (!product.quantity || !product.price) {
        console.error("Producto inválido:", product);
        return null;
      }
  
      // Clave: '18-lavanda'
const [productId, ...aromaParts] = key.split('::');
const aroma = aromaParts.join('::');
  
      total += product.price * product.quantity;
      const aromaText = aroma ? `Aroma: *${aroma}*` : 'Aroma: *N/A*';
  
      orderDetails += `- 🧴 *${product.name}* (${aromaText}) x${product.quantity} - *$${formatPrice(product.price * product.quantity)}*\n`;
  
      return {
        product_id: parseInt(productId),
        aroma: aroma || null,
        quantity: product.quantity,
        price_at_time: product.price,
        status: "pending",
        details: orderDetails
      };
    }).filter(item => item !== null);
  
    updateCartTotal().then((totalUpdated) => {
      total = totalUpdated;
      orderDetails += `\n💲 *Total:* *$${formatPrice(total.toFixed(2))}*\n`;
  
      sendOrder(orderId, items, orderDetails, deliveryMethod, paymentMethod, address, total);
    });
  }
  

  function sendOrder(orderId, items, orderDetails, deliveryMethod, paymentMethod, address, total) {
    const orderData = {
      id: orderId,
      total: total,
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      address: address,
      items: items,
       details: orderDetails
    };

    console.log("📤 Enviando orden:", orderData);

fetch('https://octopus-app.com.ar/alma-aromas/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
})
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text); });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      Swal.fire(
        'Pedido Confirmado',
        'Tu pedido ha sido enviado con éxito.',
        'success'
      ).then(() => {

        /* ───────────────────────────────────────────────
           ✅ Enviar mensaje por WhatsApp (multiplataforma)
        ─────────────────────────────────────────────── */
        const whatsappNumber = '5492994523800';
        const mensaje        = encodeURIComponent(orderDetails);
        const isIOS          = /iPad|iPhone|iPod/.test(navigator.userAgent);

        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${mensaje}`;

        if (isIOS) {
          // Misma pestaña para que Safari active el Universal Link
          location.href = whatsappLink;
        } else {
          // Pop-up en Android y navegadores de escritorio
          window.open(whatsappLink, '_blank');
        }

        /* ───────────────────────────────────────────────
           ✅ Vaciar carrito después de la compra
        ─────────────────────────────────────────────── */
        localStorage.removeItem('cart');

        /* ───────────────────────────────────────────────
           ✅ Cerrar el popup del carrito
        ─────────────────────────────────────────────── */
        const cartPopup = document.querySelector('.cart-popup');
        const overlay   = document.querySelector('.overlay');
        if (cartPopup) document.body.removeChild(cartPopup);
        if (overlay)   overlay.style.display = 'none';
        document.body.style.overflow = '';
      });
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  })
  .catch(error => {
    console.error('Error al enviar el pedido:', error);
    Swal.fire('Error', `No se pudo procesar el pedido:\n${error.message}`, 'error');
  });


  }


  function showCartPopup() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    let cartContent = '';
    let total = 0;
  
    const formattedDate = formatDateArgentina(new Date());
  
    if (Object.keys(cart).length === 0) {
      cartContent = '<p>Tu carrito está vacío</p>';
    } else {
      fetch('https://octopus-app.com.ar/alma-aromas/api/delivery')
        .then(response => response.json())
        .then(data => {
          const deliveryPrice = data.price || 0;
  
          cartContent += `<p class="fecha">${formattedDate}</p>`;
  
          const sections = {};
          for (const productKey in cart) {
            const product = cart[productKey];
            const sectionName = product.section || "Otros";
  
            if (!sections[sectionName]) {
              sections[sectionName] = [];
            }
  
            sections[sectionName].push(product);
            total += product.totalPrice || 0;
          }
  
          for (const sectionName in sections) {
            const formattedSectionName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1).toLowerCase();
            cartContent += `<h3 class="nombre-seccion">${formattedSectionName}</h3>`;
  
            sections[sectionName].forEach(product => {
              const aromaText = product.aroma ? `Aroma: ${product.aroma}` : '';
              const productTotalPrice = formatPrice((product.totalPrice || 0).toFixed(2));
  
              cartContent += `
                <div class="cart-item" data-id="${product.id}" data-aroma="${product.aroma || 'sin-aroma'}">
                  <span class="container-uno"> 
                    <span class="detalles"><strong>${product.name} (${aromaText})</strong></span> 
                    <span>
                      <button class="quantity-btn" data-action="decrease">-</button>
                      <input type="number" value="${product.quantity}" min="1" class="quantity-input" readonly>
                      <button class="quantity-btn" data-action="increase">+</button>
                    </span> 
                  </span>
                  <span class="container-uno">
                    <span class="product-total-price">$${productTotalPrice}</span>
                    <button class="remove-btn">Eliminar</button>
                  </span>
                </div>
              `;
            });
          }
  
          const cartPopup = document.createElement('div');
          cartPopup.classList.add('cart-popup');
          cartPopup.innerHTML = `
            <div id="popup-container" class="cart-popup-content">
              <span class="close"><button class="close-cart-btn">X</button></span>
              <span class="contenedor-uno">
                <h2>Pedido</h2>
                ${cartContent}
              </span>
              <span class="contenedor-dos">
                <div class="delivery-options">
                  <h3>Entrega</h3>
                  <label class="contenedor radio">
                    Retiro en el local <input type="radio" name="delivery-method" value="pickup" checked> 
                  </label>
                  <a href="https://maps.app.goo.gl/pHPUvaBK8tGC21RC9"><p>Poma N°1448 Pueblo Nuevo</p></a>
                  <label class="contenedor radio">
                    Envío a domicilio <input type="radio" name="delivery-method" value="delivery"> 
                  </label>
                  <div id="address-container" style="display: none;">
                    <input type="text" id="delivery-address" placeholder="Ingrese dirección">
                  </div>
                </div>
                <p><strong>Total: $<span id="ca-total">${formatPrice(total)}</span></strong></p>
              <p id="discount-info" style="color:#28a745;"></p>

                </span>
              <div class="payment-options">
                <h4>Pago</h4>
                <label>Transferencia<input type="radio" name="payment-method" value="Transferencia"></label><br>
                <label>Efectivo<input type="radio" name="payment-method" value="Efectivo"></label><br>
                <label>Tarjeta<input type="radio" name="payment-method" value="Tarjeta"></label>
              </div>
              <span class="container-mp">
                <button id="pay-with-mp" class="pay-btn">
                  <img class="icono-mp" src="img/logo-mercado-pago-icone-1024.png"> Pagar con mercado pago
                </button>
              </span>
              <div class="btn-popup">
                <button class="continue-shopping-btn">Seguir Comprando</button> 
                <span class="containe">
                  <button class="confirm-order-btn">
                    <img class="icono-wpp" src="img/wpp.png"> Confirmar
                  </button>
                </span>
              </div>
              <span class="vaciar-carrito-btn" id="clear-cart-button">Vaciar pedido</span>
            </div>
          `;
  
          document.body.appendChild(cartPopup);
            
document.querySelector('.confirm-order-btn').addEventListener('click', function () {
  const isMayorista = localStorage.getItem('mayorista_access') === 'true';
  const cart = JSON.parse(localStorage.getItem('cart')) || {};
  const formattedDate = formatDateArgentina(new Date());

  fetch('/alma-aromas/api/config/minimo-mayorista')
    .then(res => res.json())
.then(data => {
  if (!data.success || typeof data.value !== 'number') {
    throw new Error('Valor inválido desde /api/config/minimo-mayorista');
  }
  const MINIMO_MAYORISTA = parseInt(data.value, 10);

const totalText = document.getElementById('ca-total')?.textContent || '0';
const total = parseInt(totalText.replace(/[^\d]/g, ''), 10); // remueve todo excepto dígitos

      if (isMayorista && total < MINIMO_MAYORISTA) {
        Swal.fire({
          icon: 'warning',
          title: 'Compra mínima requerida',
          text: `El monto mínimo para pedidos mayoristas es de $${MINIMO_MAYORISTA.toLocaleString('es-AR')}.`,
        });
        return;
      }

      // Validar stock antes de confirmar
      const payload = Object.entries(cart).map(([key, product]) => {
        const [productId, ...aromaParts] = key.split('::');
        return {
          product_id: parseInt(productId),
          aroma: aromaParts.join('::'),
          quantity: product.quantity
        };
      });

      fetch('/alma-aromas/api/stock/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
         if (!data.success) {
const errores = data.insufficient.map(item => {
  const key = Object.keys(cart).find(k => {
    const [pid, ...aromaParts] = k.split('::');
    return parseInt(pid) === item.product_id && aromaParts.join('::') === item.aroma;
  });

  const product = cart[key];
  const name = product?.name || 'Producto';

  return `
    • <span class="stock-product">${name}</span> - 
      <span class="stock-aroma">Aroma: ${item.aroma}</span> 
      <span class="stock-labeluno">Disponible: ${item.available}</span> 
      <span class="stock-label">Solicitado: ${item.requested}</span>
  `;
}).join('<br>');



  return Swal.fire({
    icon: 'error',
    title: 'Stock insuficiente',
    html: `
      <div class="swal-stock-html">
        
        <div class="swal-stock-list">${errores}</div>
        <p class="swal-stock-ajuste">Ajustá la cantidad desde tu carrito.</p>
      </div>
    `,
    confirmButtonText: 'Entendido',

    customClass: {
      popup: 'swal-stock-popup',
      title: 'swal-stock-title',
      htmlContainer: 'swal-stock-container',
      confirmButton: 'swal-stock-confirm-btn'
    }
  }).then(() => {
    document.querySelectorAll('.cart-item').forEach(item => {
      item.classList.remove('stock-error');
      const msg = item.querySelector('.stock-error-msg');
      if (msg) msg.remove();
    });

    data.insufficient.forEach(({ product_id, aroma }) => {
      const selector = `.cart-item[data-id="${product_id}"][data-aroma="${aroma || 'sin-aroma'}"]`;
      const cartItem = document.querySelector(selector);
      if (cartItem) {
        cartItem.classList.add('stock-error');
        const msg = document.createElement('span');
        msg.className = 'stock-error-msg';
        msg.textContent = 'Stock insuficiente';
        cartItem.appendChild(msg);
      }
    });
  });
}


          // ✅ Todo OK
          confirmOrder(formattedDate);
        })
        .catch(() => {
          Swal.fire({
            icon: 'error',
            title: 'Error al validar el stock',
            text: 'No se pudo verificar el stock. Intenta más tarde.',
          });
        });
    })
    .catch(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error al validar el mínimo',
        text: 'No se pudo verificar el monto mínimo para mayoristas.',
      });
    });
});

  updateCartTotal()
          document.getElementById('pay-with-mp').addEventListener('click', function () {
            const total = parseFloat(document.getElementById('cart-total').textContent);
            handlePayment(total);
          });
  
          document.querySelector('.close-cart-btn').addEventListener('click', function () {
            document.body.removeChild(cartPopup);
            overlay.style.display = 'none';
            document.body.style.overflow = '';
          });
  
          document.querySelector('.continue-shopping-btn').addEventListener('click', function () {
            document.body.removeChild(cartPopup);
            overlay.style.display = 'none';
            document.body.style.overflow = '';
          });

  
          document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', handleQuantityChange);
          });
  
          document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', handleRemoveProduct);
          });
  
          document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
            radio.addEventListener('change', function () {
              const addressContainer = document.getElementById('address-container');
              addressContainer.style.display = this.value === 'delivery' ? 'block' : 'none';
  
              updateCartTotal().then((total) => {
                console.log(`Total actualizado con método de entrega: $${total}`);
              });
            });
          });
  
          document.getElementById('clear-cart-button').addEventListener('click', () => {
            localStorage.removeItem('cart');
            document.body.removeChild(document.querySelector('.cart-popup'));
            overlay.style.display = 'none';
            document.body.style.overflow = '';
          });
        });
    }
  }
  

  function handleQuantityChange(event) {
    const action = event.target.dataset.action;
    const cartItem = event.target.closest('.cart-item');
    const productId = cartItem.dataset.id;
    const aroma = cartItem.dataset.aroma || 'sin-aroma';
const productKey = `${productId}::${aroma}`;
  
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    const product = cart[productKey];
  
    if (!product) return;
  
    if (action === 'increase') {
      product.quantity += 1;
    } else if (action === 'decrease') {
      if (product.quantity > 1) {
        product.quantity -= 1;
      } else {
        delete cart[productKey];
        cartItem.remove();
      }
    }
  
    if (cart[productKey]) {
      product.totalPrice = product.price * product.quantity;
      cartItem.querySelector('.quantity-input').value = product.quantity;
      cartItem.querySelector('.product-total-price').textContent = `$${product.totalPrice.toFixed(2)}`;
    }
  
    localStorage.setItem('cart', JSON.stringify(cart));
  
   updateCartTotal().then((total) => {
  document.getElementById('ca-total').textContent = formatPrice(total);
});

  }
  
  function handleRemoveProduct(event) {
    const cartItem = event.target.closest('.cart-item');
    if (!cartItem) return;
  
    const productId = cartItem.dataset.id;
    const aroma = cartItem.dataset.aroma || 'sin-aroma';
const productKey = `${productId}::${aroma}`;
  
    console.log('Intentando eliminar producto:', { productId, aroma, productKey });
  
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    if (cart[productKey]) {
      delete cart[productKey];
      localStorage.setItem('cart', JSON.stringify(cart));
      cartItem.remove();
      console.log(`Producto con clave ${productKey} eliminado del carrito.`);
    } else {
      console.warn(`No se pudo encontrar el producto con la clave: ${productKey}`);
    }
  
    updateCartTotal().then((total) => {
document.getElementById('ca-total').textContent = formatPrice(total);
      console.log(`Nuevo total del carrito: $${total}`);
  
      if (Object.keys(cart).length === 0) {
        document.querySelector('.contenedor-uno').innerHTML = '<p>Tu carrito está vacío</p>';
      }
    });
  }
  




function updateCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || {};
  const subtotal = Object.values(cart).reduce((sum, product) => sum + (product.totalPrice || 0), 0);

  const deliveryMethodElement = document.querySelector('input[name="delivery-method"]:checked');
  const isDelivery = deliveryMethodElement && deliveryMethodElement.value === 'delivery';

  const deliveryPromise = isDelivery
    ? fetch('https://octopus-app.com.ar/alma-aromas/api/delivery')
        .then(res => res.json())
        .then(d => d.price || 0)
        .catch(() => 0)
    : Promise.resolve(0);

  const discountPromise = fetch('https://octopus-app.com.ar/alma-aromas/api/payment-fee')
    .then(res => res.json())
    .then(d => d.enabled ? subtotal * (d.fee_percent / 100) : 0)
    .catch(() => 0);

  return Promise.all([deliveryPromise, discountPromise])
    .then(([deliveryPrice, discount]) => {
      renderTotal(subtotal, deliveryPrice, discount);
      return subtotal + deliveryPrice - discount;
    });
}

function renderTotal(subtotal, deliveryPrice, discount = 0) {
  const total = subtotal + deliveryPrice - discount;
  const cartTotalElement = document.getElementById('ca-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = formatPrice(total);
  }

  let discountInfo = document.getElementById('discount-info');
  if (!discountInfo) {
    discountInfo = document.createElement('p');
   
    discountInfo.style.color = '#28a745';
    cartTotalElement?.parentElement?.appendChild(discountInfo);
  }

  if (discount > 0) {
    const totalSinDescuento = subtotal + deliveryPrice;
    const porcentaje = Math.round((discount / totalSinDescuento) * 100);
    discountInfo.innerHTML = `Sin descuento: $${formatPrice(totalSinDescuento)}<br>💸 ${porcentaje}% OFF`;
  } else {
    discountInfo.textContent = '';
  }
}





  // Evento para manejar el clic en el botón "+"
  document.body.addEventListener('click', function (event) {
    if (event.target.classList.contains('add-to-cart-btn')) {
      const productId = event.target.dataset.id;
      const productName = event.target.dataset.name;
      const productPrice = parseFloat(event.target.dataset.price);

      addToCart(productId, productName, productPrice);
    }
  });

function addToCart(productId, productName, productPrice) {
  // ✅ Paso 1: Verificar si el catálogo está pausado
  fetch('https://octopus-app.com.ar/alma-aromas/api/catalog-status')
    .then(res => res.json())
    .then(data => {
      if (data.paused) {
        Swal.fire({
          title: 'Estamos actualizando nuestro catálogo',
          text: 'En breve estará disponible. Gracias por elegirnos 😊',
          icon: 'info',
            confirmButtonText: 'Entendido',
  customClass: {
    popup: 'catalog-popup',
    title: 'catalog-title',
    content: 'catalog-content',
    confirmButton: 'catalog-confirm-btn'
  }
});
       
        return;
      }

      // ✅ Paso 2: Continuar con la lógica original
      let cart = JSON.parse(localStorage.getItem('cart')) || {};
      const productElement = document.querySelector(`.menu-item[data-id="${productId}"]`);

      if (!productElement) {
        console.warn(`Producto con ID ${productId} no encontrado en el DOM.`);
        return;
      }

      const isMayorista = localStorage.getItem('mayorista_access') === 'true';
      if (isMayorista) {
        const mayoristaText = productElement.querySelector('.item-price-mayorista')?.textContent || '';
        const raw = mayoristaText.replace(/\D/g, '');
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
          productPrice = parsed;
        }
      }

      const aromaElement = productElement.querySelector('.aroma-select');
      if (aromaElement && aromaElement.options.length > 1 && !aromaElement.value) {
        Swal.fire({
          icon: 'warning',
          title: 'Selecciona un aroma',
          text: 'Debes elegir un aroma antes de continuar.',
          confirmButtonText: 'Aceptar',
          customClass: { popup: 'mi-alerta-personalizada' }
        });
        return;
      }

      const selectedAroma = aromaElement?.value || 'sin-aroma';
      const menuSection = productElement.closest('.menu-section');
      const sectionName = menuSection?.querySelector('.section-title span')?.textContent.trim() || 'Otros';

      let mainTitle = '';
      let current = productElement.previousElementSibling;
      if (productElement.querySelector('.item-title.porciones-title')) {
        while (current) {
          const titleElement = current.querySelector('.item-title:not(.porciones-title)');
          if (titleElement) {
            mainTitle = titleElement.textContent.trim();
            break;
          }
          current = current.previousElementSibling;
        }
      }

      const finalProductName = `${sectionName} ${mainTitle} ${productName}`.trim();
      const productKey = `${productId}::${selectedAroma}`;

      if (cart[productKey]) {
        cart[productKey].quantity += 1;
        cart[productKey].totalPrice = cart[productKey].price * cart[productKey].quantity;
        console.log(`Producto existente en carrito. Cantidad actualizada a: ${cart[productKey].quantity}`);
      } else {
        cart[productKey] = {
          id: productId,
          name: finalProductName,
          price: productPrice,
          quantity: 1,
          totalPrice: productPrice,
          aroma: selectedAroma,
          section: sectionName
        };
        console.log(`Producto nuevo agregado al carrito:`, cart[productKey]);
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      console.log(`Carrito actualizado en localStorage:`, cart);
      showToast(finalProductName);
    })
    .catch(() => {
      Swal.fire('Error', 'No se pudo verificar el estado del catálogo', 'error');
    });
}


  


  // Asignar el evento `click` una sola vez para evitar duplicados
  document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener('click', function (event) {
      if (event.target.classList.contains('add-to-cart-btn')) {
        const productId = event.target.dataset.id;
        const productName = event.target.dataset.name;
        const productPrice = parseFloat(event.target.dataset.price);

        addToCart(productId, productName, productPrice);
      }
    });
  });

  // Función para mostrar la notificación con Toastify.js
  function showToast(productName) {
    Toastify({
      text: `${productName} se ha añadido a tu pedido.`,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #007bff, #0056b3)",
        borderRadius: "8px",
        fontSize: "34px",


      },
    }).showToast();
  }
  // ✅ Inicializar stockArray en el ámbito global para asegurar su disponibilidad
  let stockArray = [];
  function updateMenuItemDOM(data) {
    const el = document.querySelector(`.menu-item[data-id="${data.id}"]`);
    if (!el) return;
  
    el.querySelector('.item-title').textContent = data.nombre;
    el.querySelector('.item-price').textContent = `$${formatPrice(data.precio)}`;
    el.querySelector('.item-description').textContent = data.descripcion;
  
    const img = el.querySelector('.item-header img');
    if (img && data.img_url) {
      const currentSrc = img.getAttribute('src');
      const newSrc = data.img_url;
  
      // Verificamos si la imagen realmente cambió (por nombre o timestamp)
      if (!currentSrc.endsWith(newSrc)) {
        img.classList.add('fade-transition');
        img.style.opacity = 0;
  
        img.onload = () => {
          img.style.opacity = 1;
          img.classList.remove('fade-transition');
        };
  
        img.setAttribute('src', newSrc);
      }
    }
  }
  
  
  document.body.addEventListener('click', async function (event) {
    if (event.target.classList.contains('edit-button')) {
      const itemElement = event.target.closest('.menu-item');
      const itemId = itemElement.dataset.id;
      const itemTitle = itemElement.querySelector('.item-title').textContent;
const priceTextNode = itemElement.querySelector('.item-price')?.childNodes[0];
const itemPrice = priceTextNode && priceTextNode.nodeType === Node.TEXT_NODE
  ? priceTextNode.textContent.trim().replace('$', '')
  : '';
      const itemDescription = itemElement.querySelector('.item-description').textContent;
      const itemType = event.target.closest('.menu-section').getAttribute('data-type');
      const imgElement = itemElement.querySelector('img');
      const itemImgUrl = imgElement ? imgElement.src : '';
      const currentParentGroup = event.target.closest('.menu-group').getAttribute('data-group');

      // ✅ Obtener secciones y stock actualizado desde el backend
      Promise.all([
        fetch('https://octopus-app.com.ar/alma-aromas/api/sections').then((res) => res.json()),
        fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${itemId}`).then((res) => res.json())
      ]).then(([sectionsData, itemData]) => {
        const sections = sectionsData.data;
        const parentGroupOptions = PARENT_GROUPS.map(
          (group) =>
            `<option value="${group.id}" ${group.id === currentParentGroup ? 'selected' : ''}>${group.title}</option>`
        ).join('');

        const sectionOptions = sections
          .map(
            (section) =>
              `<option value="${section.nombre}" ${section.nombre === itemType ? 'selected' : ''}>${section.nombre}</option>`
          )
          .join('');

        // ✅ Inicializar stock con la estructura correcta desde el backend
        let stockArray = itemData.stock
        ? Object.entries(itemData.stock).map(([aroma, { id, cantidad }]) => ({ id, aroma, cantidad }))
        : [];
      

        // ✅ Función mejorada para renderizar y asignar eventos al stock
        function renderStockList() {
          const stockList = document.getElementById('stock-list');
        
          // Renderizar lista de stock desde stockArray
          stockList.innerHTML = stockArray
            .map(
              ({ id, aroma, cantidad }) => `
                <li data-id="${id}" data-aroma="${aroma}" data-cantidad="${cantidad}">
                  <span>Aroma: ${aroma} - Cant: ${cantidad}</span>
                  <button class="edit-stock-btn" data-id="${id}">✏️</button>
                  <button class="delete-stock-btn" data-id="${id}">🗑️</button>
                </li>
              `
            )
            .join('');
        
          // ✅ Editar stock
          stockList.querySelectorAll('.edit-stock-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
              const li = event.target.closest('li');
              document.getElementById('new-aroma').value = li.dataset.aroma;
              document.getElementById('new-cantidad').value = li.dataset.cantidad;
              document.getElementById('add-stock-btn').dataset.editingId = li.dataset.id;
            });
          });
        
          // ✅ Eliminar stock
          stockList.querySelectorAll('.delete-stock-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
              const li = event.target.closest('li');
              const stockId = parseInt(li.dataset.id, 10);
              stockArray = stockArray.filter((item) => item.id !== stockId);
              li.remove();
            });
          });
        }
        

        const originalTipo = itemType;
        const originalGroup = currentParentGroup;
        

        // ✅ Abrir el modal de edición con SweetAlert2
        Swal.fire({
          title: 'Editar elemento',
          showCloseButton: true,
          showCancelButton: true,
          cancelButtonText: 'Eliminar',
          confirmButtonText: 'Guardar',
          html: `
            <input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${itemTitle}" />
            <input id="swal-input2" class="swal2-input" placeholder="Precio" value="${itemPrice}" />
           <input id="swal-input-precio-mayorista" class="swal2-input" placeholder="Precio Mayorista" value="${itemData.precio_mayorista || ''}" />
            <input id="swal-input4" class="swal2-input" placeholder="Descripción" value="${itemDescription}" />
            <select id="swal-parent-group" class="swal2-input">${parentGroupOptions}</select>
            <select id="swal-input3" class="swal2-input">${sectionOptions}</select>
            <img src="${itemImgUrl}" alt="Imagen actual" style="max-width: 100%; max-height: 200px; display: block; margin: 10px auto;" />
            <input type="file" id="swal-image-upload" class="swal2-input" />
            <div id="stock-section">
              <h3>Cargá stock disponible</h3>
              <ul id="stock-list"></ul>
              <div class="container-stock">
                <span class="container-stockuno">
<input type="text" id="new-aroma" class="swal2-input" placeholder="Aroma" />
<input type="number" id="new-cantidad" class="swal2-input" placeholder="Cantidad" min="1" />

                <button id="add-stock-btn">Añadir Stock</button>
              </div>
            </div>
          `,
          didOpen: () => {
            // ✅ Renderizar lista de stock si existe
            renderStockList();
            const cancelButton = document.querySelector('.swal2-cancel');
            if (cancelButton) {
              cancelButton.addEventListener('click', () => {
                Swal.fire({
                  title: '¿Estás seguro?',
                  text: 'Esta acción eliminará el producto permanentemente.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Sí, eliminar',
                  cancelButtonText: 'Cancelar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    deleteProduct(itemId); // ✅ Llamar a deleteProduct para eliminar
                  }
                });
              });
            }
            document.getElementById('add-stock-btn').addEventListener('click', function () {
              const aroma = document.getElementById('new-aroma').value.trim();
              const cantidad = parseInt(document.getElementById('new-cantidad').value.trim(), 10);
              const editingId = this.dataset.editingId;
              
              if (aroma && !isNaN(cantidad) && cantidad >= 0) {
                if (editingId) {
                  const index = stockArray.findIndex((item) => item.id === parseInt(editingId, 10));
                  if (index !== -1) {
                    stockArray[index] = { id: parseInt(editingId, 10), aroma, cantidad };
                  }
                } else {
                  stockArray.push({ id: Date.now(), aroma, cantidad });
                }
              
                // Limpiar campos
                document.getElementById('new-aroma').value = '';
                document.getElementById('new-cantidad').value = '';
                this.removeAttribute('data-editing-id');
              
                // 🔁 Render actualizado
                renderStockList();
              } else {
                Swal.fire('Error', 'Por favor, ingresa valores válidos.', 'error');
              }
              
              
            });
            
            


            // ✅ Escuchar cambios para actualizar opciones según el grupo padre
            document.getElementById('swal-parent-group').addEventListener('change', function () {
              const groupId = this.value;
              const sectionSelect = document.getElementById('swal-input3');
              sectionSelect.innerHTML = sections
                .filter((s) => s.parent_group === groupId)
                .map((s) => `<option value="${s.nombre}">${s.nombre}</option>`)
                .join('');
            });const imageInput = document.getElementById('swal-image-upload');
            const previewImg = document.querySelector('.swal2-html-container img');
            
            imageInput.addEventListener('change', () => {
              const file = imageInput.files[0];
              if (file && previewImg) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  previewImg.removeAttribute('src'); // fuerza redibujo
                  setTimeout(() => {
                    previewImg.src = e.target.result; // ahora sí se actualiza
                  }, 30); // pequeño delay para forzar el repaint
                };
                reader.readAsDataURL(file);
              }
            });
            
            
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            const nombre = document.getElementById('swal-input1').value.trim();
            const precio = parseInt(document.getElementById('swal-input2').value.replace(/\./g, ''), 10);
            const descripcion = document.getElementById('swal-input4').value.trim();
            const tipo = document.getElementById('swal-input3').value;
            const parent_group = document.getElementById('swal-parent-group').value;
            const img_url = document.querySelector('.swal2-popup img')?.src || '';
        
            const tipoCambiado = tipo !== originalTipo;
            const grupoCambiado = parent_group !== originalGroup;
        
            const formData = new FormData();
            formData.append('nombre', nombre);
            formData.append('precio', precio);
            const precioMayorista = document.getElementById('swal-input-precio-mayorista').value.trim();
            formData.append('precio_mayorista', precioMayorista.replace(/\./g, ''));
            
            formData.append('descripcion', descripcion);
            formData.append('tipo', tipo);
            formData.append('parent_group', parent_group);
            formData.append('stock', JSON.stringify(stockArray));
        
            const imageInput = document.getElementById('swal-image-upload');
            if (imageInput.files.length > 0) {
              const compressedImage = await compressImage(imageInput.files[0], 0.7, 800, 600);
              const compressedFile = new File([compressedImage], 'imagen.webp', { type: 'image/webp' });
              formData.append('imagen', compressedFile);
            }
        
            fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${itemId}`, {
              method: 'PUT',
              body: formData
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  if (tipoCambiado || grupoCambiado) {
                    Swal.fire('Elemento actualizado', 'success').then(() => {
                      window.location.reload();
                    });
                  } else {
                    loadAromasForItem(itemId);
                    const updatedImgUrl = data.img_url || img_url;
                    updateMenuItemDOM({ id: itemId, nombre, precio, descripcion, img_url: updatedImgUrl });
                  const itemContainer = document.querySelector(`.menu-item[data-id="${itemId}"]`);
const itemPriceContainer = itemContainer?.querySelector('.item-price');
let updatedMayorista = itemContainer?.querySelector('.item-price-mayorista');

if (!updatedMayorista && itemPriceContainer) {
  updatedMayorista = document.createElement('div');
  updatedMayorista.className = 'item-price-mayorista';
  itemPriceContainer.appendChild(updatedMayorista);
}

if (updatedMayorista) {
  updatedMayorista.textContent = `$${precioMayorista.replace(/\./g, '')}`;
  updatedMayorista.style.display = 'block';
}

                    Swal.fire('Elemento actualizado', '', 'success');
                  }
                  
                } else {
                  Swal.fire('Error', 'No se pudo actualizar.', 'error');
                }
              });
          }
          
        });
      });
    }

    // ✅ Eliminar stock sin alertas y mantener el popup abierto
    if (event.target.classList.contains('delete-stock-btn')) {
      const li = event.target.closest('li');
      const stockId = li.dataset.id;

      if (stockId) {
        fetch(`https://octopus-app.com.ar/alma-aromas/api/stock/${stockId}`, {
          method: 'DELETE'
        })
          .then((response) => response.json())
          .then((data) => {
            // ✅ Verificamos si se eliminó correctamente (deleted > 0 indica éxito)
            if (data.deleted > 0) {
              // Eliminar del DOM inmediatamente
              li.remove();

              // Actualizar stockArray eliminando el stock del array
              stockArray = stockArray.filter((item) => item.id !== parseInt(stockId, 10));
            }
          })
          .catch((err) => console.error('❌ Error eliminando stock:', err));
      }
    }


   

  });


  function deleteProduct(productId) {
    console.log("Ejecutando deleteProduct para ID:", productId);
  
    fetch(`https://octopus-app.com.ar/alma-aromas/api/menu/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('jwt_alma-aromas')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log("Respuesta del servidor:", data);
  
        if (data.deleted > 0) {
          // ✅ Eliminar el elemento del DOM directamente
          const itemEl = document.querySelector(`.menu-item[data-id="${productId}"]`);
          if (itemEl) {
            const wrapper = itemEl.closest('.contenedor-items');
            if (wrapper) wrapper.remove();
          }
  
          Swal.fire("Eliminado", "El producto ha sido eliminado correctamente.", "success");
        } else {
          Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        }
      })
      .catch(error => {
        console.error("❌ Error en la eliminación:", error);
        Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
      });
  }
  


  function compressImage(file, quality = 0.85, maxWidth = 1000, maxHeight = 1000) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * scaleFactor);
            height = Math.floor(height * scaleFactor);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
        };
      };
    });
  }
  document.getElementById('create-item-button').addEventListener('click', function () {
    fetch('https://octopus-app.com.ar/alma-aromas/api/sections')
      .then(response => response.json())
      .then(data => {
        const sections = data.data;
        const sectionOptions = ''; // ❗️ Inicialmente vacío
        const parentGroupOptions = PARENT_GROUPS.map(group =>
          `<option value="${group.id}">${group.title}</option>`
        ).join('');

        // 🔥 función para renderizar secciones por grupo
        const renderSectionOptions = (groupId) => {
          const filtered = sections.filter(s => s.parent_group === groupId);
          return filtered.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
        };

        Swal.fire({
          title: 'Crear nuevo elemento',
          html: `
                  <input id="swal-input1" class="swal2-input" placeholder="Nombre" />
                  <input id="swal-input2" class="swal2-input" placeholder="Precio" />
                  <input id="swal-input-precio-mayorista" class="swal2-input" placeholder="Precio Mayorista" />
                  <input id="swal-input4" class="swal2-input" placeholder="Descripción" />
                  <input type="file" id="swal-file-upload" class="swal2-input" />
                  <select id="swal-parent-group" class="swal2-input">
                      <option value="" disabled selected>Seleccionar Sección</option>
                      ${parentGroupOptions}
                  </select>
                <select id="swal-input3" class="swal2-input">
    <option value="" disabled selected>Seleccionar Categoría</option>
</select>


                  <div id="new-section-input" style="display:none; margin-top: 10px;">
                      <input id="swal-new-section" class="swal2-input" placeholder="Nombre de la nueva Categoría" />
                  </div>
                  <label id="subelement">
                      <input type="checkbox" id="swal-subelement-checkbox"> ¿Es un subelemento?
                  </label>
                  <div id="stock-section">
                           <h3>Cargá stock disponible</h3>
                        <ul id="stock-list"></ul>
                        <div class="container-stock">
                          <span class="container-stockuno">
<input type="text" id="new-aroma" class="swal2-input" placeholder="Aroma" />
<input type="number" id="new-cantidad" class="swal2-input" placeholder="Cantidad" min="0" />

                          <button id="add-stock-btn">Añadir Stock</button>
                      </div>
                  </div>
              `,
          showCloseButton: true,
          focusConfirm: false,
          confirmButtonText: 'Confirmar',
          preConfirm: async () => {
            const nombre = document.getElementById('swal-input1').value.trim();
            const precio = document.getElementById('swal-input2').value.trim();
            const precioMayorista = document.getElementById('swal-input-precio-mayorista').value.trim();
            const descripcion = document.getElementById('swal-input4').value.trim();
            const selectedParentGroup = document.getElementById('swal-parent-group').value;
            if (!selectedParentGroup) {
              Swal.showValidationMessage('Por favor, selecciona una sección antes de guardar.');
              return false; // ❌ Detener si no se seleccionó una sección
            }
            const formData = new FormData();
            formData.append('nombre', nombre);
            formData.append('precio', precio.replace(/\./g, ''));
            formData.append('descripcion', descripcion);
            formData.append('parent_group', selectedParentGroup);
            formData.append('precio_mayorista', precioMayorista.replace(/\./g, ''));

            const tipo = document.getElementById('swal-input3').value;
            if (tipo === 'new-section') {
              const newSectionName = document.getElementById('swal-new-section').value.trim();
              if (!newSectionName) {
                Swal.showValidationMessage('Por favor, ingresa el nombre de la nueva Categoría');
                return false;
              }
              formData.append('tipo', 'new-section');
              formData.append('newSectionName', newSectionName);
            } else {
              formData.append('tipo', tipo);
            }

            const fileInput = document.getElementById('swal-file-upload');
            if (fileInput.files[0]) {
              const compressedImage = await compressImage(fileInput.files[0], 0.7, 800, 600);
              const compressedFile = new File([compressedImage], 'imagen.webp', { type: 'image/webp' });
              formData.append('imagen', compressedFile);
            }
            const stock = Array.from(document.querySelectorAll('#stock-list li')).map(li => ({
              aroma: li.dataset.aroma,
              cantidad: parseInt(li.dataset.cantidad, 10)
            })).filter(item => item.aroma && !isNaN(item.cantidad) && item.cantidad >= 0);
            

            formData.append('stock', JSON.stringify(stock));
            formData.append('subelement', document.getElementById('swal-subelement-checkbox').checked);

            return formData;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const formData = result.value;
            const tipo = document.getElementById('swal-input3').value;
const selectedParentGroup = document.getElementById('swal-parent-group').value;

localStorage.setItem('lastCreatedItemTipo', tipo);
localStorage.setItem('lastCreatedItemGrupo', selectedParentGroup);

            
            fetch('https://octopus-app.com.ar/alma-aromas/api/menu', {
              method: 'POST',
              body: formData
            })
              .then(async response => {
                const data = await response.json();

                if (!response.ok) {
                  // 💬 Detectar error de sección ya existente
                  if (response.status === 400 && data.error?.includes("ya existe en")) {
                    Swal.fire('⚠️ Sección duplicada', data.error, 'warning');
                  } else {
                    Swal.fire('Error al crear el ítem', data.error || 'Error desconocido', 'error');
                  }
                  return;
                }

                if (data.id) {
                  Swal.fire('Elemento creado correctamente', '', 'success').then(() => {
                    // 👇 Solo recargamos datos
                    fetchMenuDataFromServer();
                  });
                  
                  
                  
                } else {
                  Swal.fire('Error al crear el ítem', 'No se recibió confirmación de creación', 'error');
                }
              })
              .catch(err => Swal.fire('Error de red', err.message, 'error'));

          }
        });
     

        document.addEventListener('change', function (e) {
          if (e.target.id === 'swal-parent-group') {
            const groupId = e.target.value;
            const sectionSelect = document.getElementById('swal-input3');
            const newSectionHTML = `<option value="new-section">Nueva Categoría</option>`;
        
            // ✅ Verificar si NO se seleccionó ninguna sección
            if (!groupId) {
              sectionSelect.innerHTML = ''; // ❌ Vaciar opciones si no hay grupo seleccionado
              return; // ✅ Salir si no hay grupo seleccionado
            }
        
            // ✅ Obtener opciones filtradas si hay un grupo seleccionado
            const filteredOptions = renderSectionOptions(groupId);
        
            // ✅ Siempre incluir "Nueva Categoría" al final
            sectionSelect.innerHTML = filteredOptions
              ? `${filteredOptions}${newSectionHTML}`
              : newSectionHTML;
        
            // 🔥 Si solo hay "Nueva Categoría", seleccionarla automáticamente y forzar evento change
            if (!filteredOptions || sectionSelect.options.length === 1) {
              sectionSelect.value = 'new-section';
              sectionSelect.dispatchEvent(new Event('change')); // ✅ Forzar evento para mostrar el input
            }
          }
        });
        
        

        // Agregar evento para mostrar u ocultar el campo de nueva sección
        document.getElementById('swal-input3').addEventListener('change', function () {
          const newSectionInput = document.getElementById('new-section-input');
          if (this.value === 'new-section') {
            newSectionInput.style.display = 'block';
          } else {
            newSectionInput.style.display = 'none';
          }
        });

        document.getElementById('add-stock-btn').addEventListener('click', () => {
          const aroma = document.getElementById('new-aroma').value.trim();
          const cantidad = parseInt(document.getElementById('new-cantidad').value.trim(), 10);
          if (aroma && !isNaN(cantidad)) {
            const li = document.createElement('li');
            li.dataset.aroma = aroma;
            li.dataset.cantidad = cantidad;
            li.innerHTML = `
              Aroma: ${aroma} - Cant: ${cantidad}
              <button class="edit-stock-btn">✏️</button>
              <button class="delete-stock-btn">🗑️</button>
            `;
            document.getElementById('stock-list').appendChild(li);
          
            li.querySelector('.delete-stock-btn').addEventListener('click', () => li.remove());
            li.querySelector('.edit-stock-btn').addEventListener('click', () => {
              document.getElementById('new-aroma').value = li.dataset.aroma;
              document.getElementById('new-cantidad').value = li.dataset.cantidad;
              li.remove();
            });
          
            document.getElementById('new-aroma').value = '';
            document.getElementById('new-cantidad').value = '';
          } else {
            alert('Por favor, ingresa un aroma y una cantidad válida.');
          }
        });
      });
  });



  const createAnnouncementButton = document.getElementById('create-announcement-button');
  if (createAnnouncementButton) {

    createAnnouncementButton.addEventListener('click', function () {
      fetch('https://octopus-app.com.ar/alma-aromas/api/announcements') // Solicitud GET
        .then(response => response.json())
        .then(data => {
          let modalTitle = 'Crear Anuncio';
          let text = '';
          let paragraph = '';
          let stateChecked = '';
          let imageUrl = ''; // URL de la imagen del anuncio

          if (data.success && data.announcement) {
            // Si hay un anuncio activo, carga los datos en el modal
            modalTitle = 'Editar Anuncio';
            text = data.announcement.text || '';
            paragraph = data.announcement.paragraph || '';
            stateChecked = data.announcement.state ? 'checked' : '';
            imageUrl = data.announcement.image_url || ''; // Asegúrate de obtener la URL de la imagen correctamente
          }

          Swal.fire({
            title: modalTitle,
            showCloseButton: true,
            confirmButtonText: 'Confirmar',

            html: `
              <img src="${imageUrl}" alt="Imagen Actual" id="current-image-preview" style="max-width:300px;" onerror="this.style.display='none'"/> <!-- Muestra la imagen actual -->
              <input type="file" id="swal-image-upload" class="swal2-input"> <!-- Para cargar una nueva imagen -->
              <input id="swal-text" class="swal2-input" placeholder="Texto del anuncio" value="${text}">
              <input id="swal-paragraph" class="swal2-input" placeholder="Párrafo del anuncio" value="${paragraph}">
              <span class="check"><input type="checkbox" id="swal-state" class="swal2-checkbox" ${stateChecked}> Activo</span>
            `,
            focusConfirm: false,
            preConfirm: async () => {
              // ✅ Validar existencia de elementos antes de continuar
              const textInput = document.getElementById('swal-text');
              const paragraphInput = document.getElementById('swal-paragraph');
              const stateInput = document.getElementById('swal-state');
              const fileInput = document.getElementById('swal-image-upload');
            
              // ❗️ Si algún elemento no existe, mostrar error y detener proceso
              if (!textInput || !paragraphInput || !stateInput) {
                Swal.showValidationMessage('Por favor, completa todos los campos.');
                return false;
              }
            
              // ✅ Crear y rellenar FormData
              const formData = new FormData();
              formData.append('text', textInput.value.trim());
              formData.append('paragraph', paragraphInput.value.trim());
              formData.append('state', stateInput.checked);
            
              // ✅ Comprimir imagen si existe
              if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
            
                try {
                  // 🎉 Comprimir la imagen antes de enviarla
                  const compressedBlob = await compressImage(file, 0.7, 800, 600);
                  const compressedFile = new File([compressedBlob], 'compressed-anuncio.webp', {
                    type: 'image/webp',
                  });
            
                  formData.append('image', compressedFile);
                } catch (err) {
                  console.error('Error al comprimir la imagen:', err);
                  Swal.showValidationMessage('Error al comprimir la imagen. Intenta de nuevo.');
                  return false;
                }
              }
            
              // ✅ Retornar el FormData comprimido para ser enviado al backend
              return formData;
            }
            
          }).then((result) => {
            if (result.isConfirmed) {
              fetch('https://octopus-app.com.ar/alma-aromas/api/announcements', {
                method: 'POST',
                body: result.value, // Enviar el objeto FormData
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  return response.json(); // Parsea la respuesta como JSON
                })
                .then(data => {
                  if (data.success) {
                    Swal.fire('Éxito', 'El anuncio se ha creado/actualizado correctamente.', 'success');
                    console.log('Anuncio creado/actualizado con ID:', data.id);
                  } else {
                    Swal.fire('Error', data.error || 'No se pudo crear/actualizar el anuncio.', 'error');
                  }
                })
                .catch(err => {
                  console.error('Error al guardar el anuncio:', err);
                  Swal.fire('Error', 'No se pudo guardar el anuncio.', 'error');
                });
            }
          });
        })
        .catch(error => {
          console.error('Error al cargar el anuncio:', error);
          Swal.fire('Error', 'No se pudo cargar el anuncio.', 'error');
        });
    });
  }
  menuItemsPromise = loadMenuItems();

});

function showAnnouncementPopup(data) {
  if (!data) return; // No ejecutar si no hay datos precargados

  Swal.fire({
    title: data.text,
    html: `<p>${data.paragraph}</p>`,
    imageUrl: data.image_url, // Usar la imagen ya precargada
    imageWidth: 400,
    imageHeight: 200,
    imageAlt: 'Imagen del anuncio',
    confirmButtonText: 'Continuar',
    customClass: {
      popup: 'popup-anuncio' // Aquí asignamos una clase especial
    }
  });
}

// Función para cerrar la sesión
function simpleLogout() {
  localStorage.removeItem('jwt_alma-aromas');
  window.location.reload();  // Recarga la página
}

// Vincula la función al evento click del botón "Cerrar Sesión"
document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {  // Comprueba si el botón existe en la página
    logoutButton.addEventListener('click', simpleLogout);
  }
});

function copyAlias() {
  var alias = document.getElementById('aliasText').innerText;
  var copyIcon = document.querySelector('.copy-icon');
  navigator.clipboard.writeText(alias)
    .then(() => {
      // Cambia el background-color a verde claro
      copyIcon.style.backgroundColor = '#4c4e4c';

      // Restablece el background-color después de 2 segundos
      setTimeout(() => {
        copyIcon.style.backgroundColor = ''; // Quita el color de fondo
      }, 2000);
    })
    .catch(err => {
      console.error('Error al copiar: ', err);
    });
}

const hamburger = document.getElementById('hamburger');
const navbarLinks = document.getElementById('navbar-links');

// Toggle the active class for the hamburger menu
hamburger.addEventListener('click', function () {
  hamburger.classList.toggle('active');
  navbarLinks.classList.toggle('active');
});

// Close the menu if scrolling
window.addEventListener('scroll', function () {
  navbarLinks.classList.remove('active');
  hamburger.classList.remove('active');
});


// Close the menu if scrolling
window.addEventListener('scroll', function () {
  navbarLinks.classList.remove('active');
  hamburger.classList.remove('active');
});

window.onscroll = function () {
  scrollFunction();
};

function capitalizeFirstLetter(string) {
  if (!string) return ''; // Evita errores si el string es null o undefined
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function loadMenuSections() {
  fetch('https://octopus-app.com.ar/alma-aromas/api/sections')

    .then(response => response.json())
    .then(data => {
      const sections = data.data;
      const navbarLinks = document.getElementById('navbar-links');

      // Limpiar enlaces actuales
      navbarLinks.innerHTML = '';
      PARENT_GROUPS.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'nav-group';

        // Crear enlace del grupo padre
        const parentLink = document.createElement('a');
        parentLink.href = '#';
        parentLink.className = 'parent-link';
        parentLink.dataset.group = group.id;
        parentLink.innerHTML = `${group.title} <img src="img/call_made_20dp_FILL0_wght400_GRAD0_opsz20.png" alt="">`;

        groupContainer.appendChild(parentLink);

        // Crear contenedor para los enlaces de sección de este grupo
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'section-links';

        // Agregar enlaces de secciones del menú
        sections.forEach(section => {
          if (section.parent_group === group.id) {
            const link = document.createElement('a');
            link.href = '#';
            link.dataset.type = section.nombre;
            link.dataset.group = group.id;
            link.innerHTML = `${capitalizeFirstLetter(section.nombre)} <img src="img/call_made_20dp_FILL0_wght400_GRAD0_opsz20.png" alt="">`;
            sectionsContainer.appendChild(link);
          }
        });

        groupContainer.appendChild(sectionsContainer);
        navbarLinks.appendChild(groupContainer);
      });

      // Añadir eventos de click a todos los enlaces
      addNavbarLinkEvents();
    })
    .catch(err => {
      console.error('Error al cargar secciones del menú:', err);
    });
}

function addNavbarLinkEvents() {
  // Enlaces de sección
  const menuLinks = document.querySelectorAll('.navbar-links a[data-type]');
  menuLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetType = this.getAttribute('data-type');
      const targetGroup = this.getAttribute('data-group');

      // Primero encontrar el grupo correcto
      const targetGroupContainer = document.querySelector(`.menu-group[data-group="${targetGroup}"]`);
      if (!targetGroupContainer) return;

      // Luego buscar la sección dentro de ese grupo
      const targetSection = targetGroupContainer.querySelector(`.menu-section[data-type="${targetType}"]`);

      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 100, // Ajuste para el navbar fijo
          behavior: 'smooth'
        });
        navbarLinks.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  });

  // Enlaces padre (grupos)
  const parentLinks = document.querySelectorAll('.navbar-links .parent-link');
  parentLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const groupContainer = this.parentElement;
      const sectionLinks = groupContainer.querySelector('.section-links');
  
      const isVisible = sectionLinks.style.display === 'block';
      sectionLinks.style.display = isVisible ? 'none' : 'block';
  
      // Toggle clase para rotar ícono
      this.classList.toggle('open', !isVisible);
    });
  });
  
  
}
function scrollFunction() {
  const navbar = document.querySelector('.navbar'); // Selecciona el navbar

  if (document.documentElement.scrollTop > 20) {
    // Si se hace scroll hacia abajo, muestra el navbar
    if (!navbar.classList.contains('visible')) {
      navbar.classList.add('visible');
    }
  } else {
    // Si se vuelve al tope, oculta el navbar
    if (navbar.classList.contains('visible')) {
      navbar.classList.remove('visible');
    }
  }
}

// Asocia la función al evento de scroll
window.addEventListener('scroll', scrollFunction);


window.addEventListener('scroll', () => {
  const parallaxContainers = document.querySelectorAll('.parallax-container img');
  parallaxContainers.forEach(img => {
    const container = img.closest('.parallax-container');
    const rect = container.getBoundingClientRect();

    // Define un umbral para "desembosar" antes
    const threshold = window.innerHeight * 0.55; // Ajusta según lo necesario

    // Si el contenedor está cerca o dentro del viewport
    if (rect.top <= window.innerHeight + threshold && rect.bottom >= -threshold) {
      const speed = 0.5; // Velocidad del efecto
      const yOffset = -((rect.top - threshold) * speed); // Aplica el umbral

      // Aplica el movimiento solo a la imagen
      img.style.transform = `translateY(${yOffset}px)`;
    }
  });
});

let announcementData = null; // Variable para guardar los datos del anuncio
let announcementImage = new Image(); // Precargar la imagen


// Precargar el anuncio antes de mostrar contenido
fetch('https://octopus-app.com.ar/alma-aromas/api/announcements')
  .then(response => response.json())
  .then(data => {
    if (data.success && data.announcement && data.announcement.state) {
      announcementData = data.announcement;
      const announcementImage = new Image();
      announcementImage.src = data.announcement.image_url; // Precarga
    }
  })
  .catch(error => console.error("Error precargando el anuncio:", error));



document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hide-loader');

    setTimeout(() => {
      document.getElementById('loader').style.display = 'none'; // Oculta completamente el loader
    }, 1000);

    // Mostrar el contenido de la app de forma gradual
    document.querySelector('.container').style.opacity = '1';
    document.querySelector('footer').style.opacity = '1';

    // Si el anuncio ya está precargado, mostrarlo inmediatamente
    setTimeout(() => {
      if (announcementData) {
        showAnnouncementPopup(announcementData);
      }
    }, 400);
  }, 2800);
});
function scrollToGroupTitle() {
  const target = document.querySelector(".group-title");
  if (target) {
    window.scrollTo({
      top: target.offsetTop,
      behavior: "smooth"
    });
    setTimeout(() => {
      window.scrollTo({
        top: target.offsetTop - 420,
        behavior: "smooth"
      });
    }, 1000);
  }
}
menuSectionsPromise = loadMenuSections();





function handleScrollForButtons() {
  const buttons = [
    document.getElementById('cart-button'),
    document.getElementById('scrollToTopButton'),
    document.getElementById('scrollToBottomButton'),
  ];
  const footer = document.getElementById('footer');
  if (!footer) return;

  const footerRect = footer.getBoundingClientRect();
  const isFooterVisible = footerRect.top < window.innerHeight;

  buttons.forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle('move-up', isFooterVisible);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', handleScrollForButtons);
});



// Agregar evento de scroll para detectar el final del scroll
window.addEventListener('scroll', handleScrollForButtons);

const frases = [
  "Vos también podés digitalizarte",
  "Sumate a la Comunidad Octopus",
];

let fraseIndex = 0;
const fraseElemento = document.getElementById("frase");

function cambiarFrase() {
  // Oculta la frase actual suavemente
  fraseElemento.style.opacity = 0;
  fraseElemento.style.transform = "translateX(-100%)";

  setTimeout(() => {
    // Cambia la frase después del tiempo de transición
    fraseIndex = (fraseIndex + 1) % frases.length;
    fraseElemento.textContent = frases[fraseIndex];

    // Restablece la posición para la nueva frase desde la derecha
    fraseElemento.style.transform = "translateX(100%)";

    setTimeout(() => {
      // Muestra la nueva frase entrando desde la derecha
      fraseElemento.style.opacity = 1;
      fraseElemento.style.transform = "translateX(0)";
    }, 50);
  }, 1000); // Tiempo de espera antes de cambiar la frase
}

// Inicia el carrusel de frases
setInterval(cambiarFrase, 4000); // Tiempo total para cambiar frase (4 segundos)


document.addEventListener('DOMContentLoaded', function () {
  const MAYORISTA_KEY = 'mayorista_access';
  const isMayorista = localStorage.getItem(MAYORISTA_KEY) === 'true';
  const isAdmin = !!localStorage.getItem('jwt_alma-aromas');  // 👈 admin se detecta por token JWT

  // Mostrar precios mayoristas si es admin o mayorista
  if (isMayorista || isAdmin) {
    document.querySelectorAll('.item-price-mayorista').forEach(el => el.style.display = 'block');
  }

  // Si es mayorista y NO es admin, ocultar precio minorista
  if (isMayorista && !isAdmin) {
    document.querySelectorAll('.item-price').forEach(el => {
      const priceText = el.firstChild;
      if (priceText && priceText.nodeType === Node.TEXT_NODE) {
        priceText.textContent = '';
      }
    });
  }

  document.getElementById('btn-mayorista-toggle').addEventListener('click', () => {
    document.getElementById('popup-mayorista').classList.remove('hidden');
  });

  document.getElementById('btn-acceder').addEventListener('click', () => {
    const inputPass = document.getElementById('mayorista-pass').value.trim();

    fetch('/alma-aromas/api/config/password/mayorista')
      .then(res => res.json())
      .then(data => {
        const currentPassword = data.password?.trim();
        if (inputPass === currentPassword) {
const expireAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
localStorage.setItem(MAYORISTA_KEY, 'true');
localStorage.setItem('mayorista_expire_at', expireAt.toString());
const trigger = document.getElementById('btn-mayorista-toggle');
if (trigger) {
  trigger.textContent = 'Estás viendo precios como mayorista';
  trigger.style.cursor = 'pointer';
  trigger.removeAttribute('href');
}
          document.getElementById('popup-mayorista').classList.add('hidden');
          Swal.fire('Acceso concedido', 'Ahora puedes ver precios mayoristas.', 'success');

          document.querySelectorAll('.item-price-mayorista').forEach(el => el.style.display = 'block');

          const isAdminNow = !!localStorage.getItem('jwt_alma-aromas');  // vuelve a comprobar

          if (!isAdminNow) {
            document.querySelectorAll('.item-price').forEach(el => {
              const priceText = el.firstChild;
              if (priceText && priceText.nodeType === Node.TEXT_NODE) {
                priceText.textContent = '';
              }
            });
          }
        } else {
          Swal.fire('Contraseña incorrecta', 'Verifica la contraseña ingresada.', 'error');
        }
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudo verificar la contraseña.', 'error');
      });
  });

  document.getElementById('btn-admin-pass')?.addEventListener('click', () => {
    fetch('/alma-aromas/api/config/password/mayorista')
      .then(res => res.json())
      .then(data => {
        const current = data.password || '';
        Swal.fire({
          title: 'Editar contraseña mayorista',
          input: 'text',
          inputValue: current,
          showCancelButton: true,
          confirmButtonText: 'Guardar',
          cancelButtonText: 'Cancelar'
        }).then(result => {
          if (result.isConfirmed) {
            fetch('/alma-aromas/api/config/password/mayorista', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: result.value.trim() })
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  Swal.fire('Actualizado', 'Contraseña cambiada con éxito', 'success');
                } else {
                  Swal.fire('Error', data.error || 'No se pudo guardar', 'error');
                }
              });
          }
        });
      });
  });
});

const btnMinimo = document.getElementById('btn-minimo-mayorista');

btnMinimo?.addEventListener('click', () => {
fetch('/alma-aromas/api/config/minimo-mayorista')
    .then(res => res.json())
    .then(data => {
      const current = data.value || 40000;

      Swal.fire({
        title: 'Editar monto mínimo mayorista',
        input: 'number',
        inputValue: current,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          fetch('/alma-aromas/api/config/minimo-mayorista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: result.value })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                Swal.fire('Actualizado', 'Monto mínimo actualizado con éxito', 'success');
              } else {
                Swal.fire('Error', data.error || 'No se pudo guardar', 'error');
              }
            });
        }
      });
    });
});


document.getElementById('btn-cerrar-popup')?.addEventListener('click', () => {
  document.getElementById('popup-mayorista')?.classList.add('hidden');
});
const mayoristaTrigger = document.getElementById('btn-mayorista-toggle');

if (localStorage.getItem('mayorista_access') === 'true' && mayoristaTrigger) {
  mayoristaTrigger.textContent = 'Estás viendo precios como mayorista';
  mayoristaTrigger.style.cursor = 'pointer';
  mayoristaTrigger.removeAttribute('href');

  mayoristaTrigger.addEventListener('click', () => {
    Swal.fire({
      title: '¿Cerrar sesión mayorista?',
      text: 'Volverás a ver precios como cliente minorista.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('mayorista_access');
        location.reload();
      }
    });
  });
}

