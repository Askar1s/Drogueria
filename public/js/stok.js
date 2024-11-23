let editIndex = -1; // Para saber si estamos editando un producto
const products = []; // Array para almacenar los productos

document.getElementById('product-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const productName = document.getElementById('product-name').value;
    const productQuantity = document.getElementById('product-quantity').value;
    const productPrice = document.getElementById('product-price').value;

    if (editIndex === -1) {
        addProduct(productName, productQuantity, productPrice);
    } else {
        updateProduct(productName, productQuantity, productPrice);
    }

    // Limpiar el formulario
    this.reset();
    editIndex = -1; // Reiniciar el índice de edición
});

function addProduct(name, quantity, price) {
    const tableBody = document.querySelector('#product-table tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${name}</td>
        <td>${quantity}</td>
        <td>$${parseFloat(price).toFixed(2)}</td>
        <td>
            <button class="edit" onclick="editProduct(this)">Editar</button>
            <button class="delete" onclick="deleteProduct(this)">Eliminar</button>
        </td>
    `;

    tableBody.appendChild(row);
    products.push({ name, quantity, price });
}

function editProduct(button) {
    const row = button.parentNode.parentNode;
    const name = row.cells[0].innerText;
    const quantity = row.cells[1].innerText;
    const price = row.cells[2].innerText.replace('$', '');

    document.getElementById('product-name').value = name;
    document.getElementById('product-quantity').value = quantity;
    document.getElementById('product-price').value = price;

    editIndex = Array.from(row.parentNode.children).indexOf(row);
}

function updateProduct(name, quantity, price) {
    const tableBody = document.querySelector('#product-table tbody');
    const row = tableBody.children[editIndex];

    row.cells[0].innerText = name;
    row.cells[1].innerText = quantity;
    row.cells[2].innerText = `$${parseFloat(price).toFixed(2)}`;
}

function deleteProduct(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}
