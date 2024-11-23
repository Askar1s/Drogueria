// Obtener los elementos del DOM
const facturaForm = document.getElementById('facturaForm');
const addProductoBtn = document.getElementById('add-producto');
const productosContainer = document.getElementById('productos-container');

// Función para agregar un producto al formulario
addProductoBtn.addEventListener('click', () => {
    const productoItem = document.createElement('div');
    productoItem.classList.add('producto-item');

    productoItem.innerHTML = `
        <label for="producto">Producto:</label>
        <input type="text" class="producto" name="producto[]" required>

        <label for="cantidad">Cantidad:</label>
        <input type="number" class="cantidad" name="cantidad[]" required>

        <label for="precio">Precio por Unidad:</label>
        <input type="number" class="precio" name="precio[]" required>

        <button type="button" class="remove-producto">Eliminar Producto</button>
    `;

    // Agregar el nuevo producto al contenedor
    productosContainer.appendChild(productoItem);

    // Añadir la funcionalidad para eliminar un producto
    const removeButton = productoItem.querySelector('.remove-producto');
    removeButton.addEventListener('click', () => {
        productosContainer.removeChild(productoItem);
    });
});

// Función para enviar el formulario y guardar la factura
facturaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Obtener los datos del formulario
    const nombre = document.getElementById('nombre').value;

    const productos = [];
    const productoElements = document.querySelectorAll('.producto-item');

    let totalFactura = 0;  // Para calcular el total general de la factura

    productoElements.forEach(item => {
        const producto = item.querySelector('.producto').value;
        const cantidad = parseFloat(item.querySelector('.cantidad').value);
        const precio = parseFloat(item.querySelector('.precio').value);

        // Validaciones
        if (!producto || isNaN(cantidad) || isNaN(precio) || cantidad <= 0 || precio <= 0) {
            alert("Por favor, rellena todos los campos del producto correctamente.");
            return;
        }

        const totalProducto = cantidad * precio;  // Total por producto
        productos.push({ producto, cantidad, precio, total: totalProducto });

        totalFactura += totalProducto;  // Sumar al total general de la factura
    });

    if (productos.length === 0) {
        alert("Por favor, agrega al menos un producto.");
        return;
    }

    // Enviar la factura al backend
    fetch('http://localhost:3000/guardarFactura', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nombre_cliente: nombre, // Solo enviar el nombre del cliente
            productos: productos,
            total: totalFactura  // Enviar el total general de la factura
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);  // Confirmación de éxito
            cargarFacturas();  // Recargar la lista de facturas
        } else if (data.error) {
            alert(data.error);  // Mostrar error si ocurre
        }
    })
    .catch(err => {
        console.error('Error al guardar la factura:', err);
        alert('Error al guardar la factura.');
    });
});

// Función para cargar todas las facturas generadas
function cargarFacturas() {
    fetch('http://localhost:3000/getAllFacturas')
        .then(response => response.json())
        .then(data => {
            const facturasList = document.getElementById('facturas-list');
            facturasList.innerHTML = '';  // Limpiar la lista antes de agregar nuevas

            if (data.length === 0) {
                facturasList.innerHTML = '<li>No se encontraron facturas.</li>';
            } else {
                data.forEach(factura => {
                    const li = document.createElement('li');
                    li.textContent = `Factura ID: ${factura.id}, Cliente: ${factura.nombre_cliente}, Total: $${factura.total}`;
                    facturasList.appendChild(li);
                });
            }
        })
        .catch(err => {
            console.error('Error al cargar las facturas:', err);
            alert('Error al cargar las facturas.');
        });
}

// Cargar facturas al inicio
cargarFacturas();


document.addEventListener("DOMContentLoaded", function () {
    // Añadir evento para agregar más productos
    document.getElementById("add-producto").addEventListener("click", function () {
        const productoItem = document.querySelector(".producto-item");
        const newProductoItem = productoItem.cloneNode(true);
        document.getElementById("productos-container").appendChild(newProductoItem);

        // Limpiar los valores de los campos clonados
        newProductoItem.querySelector(".producto").value = "";
        newProductoItem.querySelector(".cantidad").value = "";
        newProductoItem.querySelector(".precio").value = "";

        // Añadir funcionalidad para eliminar un producto
        newProductoItem.querySelector(".remove-producto").addEventListener("click", function () {
            newProductoItem.remove();
        });
    });

    // Evento para generar la factura
    document.getElementById("facturaForm").addEventListener("submit", function (e) {
        e.preventDefault(); // Evitar que el formulario se envíe de forma tradicional

        // Obtener la librería jsPDF
        const { jsPDF } = window.jspdf;

        // Capturar los valores del formulario
        const nombre = document.getElementById("nombre").value;

        // Capturar los productos
        const productos = [];
        const productosElements = document.querySelectorAll(".producto-item");

        productosElements.forEach(item => {
            const producto = item.querySelector(".producto").value;
            const cantidad = parseFloat(item.querySelector(".cantidad").value);
            const precio = parseFloat(item.querySelector(".precio").value);

            if (!producto || isNaN(cantidad) || isNaN(precio) || cantidad <= 0 || precio <= 0) {
                alert("Por favor, rellena todos los campos del producto correctamente.");
                return;
            }

            const total = cantidad * precio;
            productos.push({ producto, cantidad, precio, total });
        });

        if (productos.length === 0) {
            alert("Por favor, agrega al menos un producto.");
            return;
        }

        // Crear el documento PDF
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Factura Electrónica", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text("Emisor: Empresa XYZ S.A.S.", 10, 40);
        doc.text("NIT: 1234567890", 10, 50);
        doc.text("Dirección: Calle 123, Bogotá, Colombia", 10, 60);

        doc.text(`Receptor: ${nombre}`, 10, 80);
        doc.text("Dirección: Calle 456, Medellín, Colombia", 10, 100);

        let y = 120;
        doc.setFontSize(12);
        doc.text("Descripción", 10, y);
        doc.text("Cantidad", 100, y);
        doc.text("Precio", 130, y);
        doc.text("Total", 160, y);

        y += 10;
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);

        productos.forEach(item => {
            y += 10;
            doc.text(item.producto, 10, y);
            doc.text(item.cantidad.toString(), 100, y);
            doc.text(`$${item.precio.toFixed(2)}`, 130, y);
            doc.text(`$${item.total.toFixed(2)}`, 160, y);
        });

        const totalFactura = productos.reduce((acc, item) => acc + item.total, 0);
        y += 20;
        doc.setFontSize(14);
        doc.text(`Total: $${totalFactura.toFixed(2)}`, 130, y);

        doc.setFontSize(10);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 10, y + 10);

        doc.save("factura.pdf");
    });
});

