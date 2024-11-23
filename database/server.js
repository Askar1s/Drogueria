// Importar dependencias
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

// Crear la aplicación de Express
const app = express();
const port = 3000;

// Configuración del middleware para parsear JSON
app.use(bodyParser.json());
app.use(cors());  // Mover esta línea después de la creación de 'app'

// Crear conexión con MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Tu contraseña de MySQL
    database: 'sistema_usuarios'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// Ruta para registrar un usuario
app.post('/register', (req, res) => {
    const { nombre, email, password, confirm_password, cargo } = req.body;

    // Validar que las contraseñas coinciden
    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Verificar si el email ya está registrado
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Encriptar la contraseña
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error al encriptar la contraseña' });
            }

            // Insertar el usuario en la base de datos
            const query = 'INSERT INTO usuarios (nombre, email, password, cargo) VALUES (?, ?, ?, ?)';
            db.query(query, [nombre, email, hashedPassword, cargo], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }

                return res.status(201).json({ message: 'Usuario registrado exitosamente' });
            });
        });
    });
});

// Ruta para el inicio de sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Buscar el usuario en la base de datos
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar la contraseña' });
            }

            if (!isMatch) {
                return res.status(400).json({ error: 'Contraseña incorrecta' });
            }

            // Si las credenciales son correctas
            return res.status(200).json({ message: 'Inicio de sesión exitoso' });
        });
    });
});

// Ruta para obtener el perfil de un usuario
app.get('/getProfile', (req, res) => {
    const email = req.query.email; // Obtenemos el email como parámetro de consulta

    if (!email) {
        return res.status(400).json({ error: 'El email es requerido' });
    }

    // Consultar los datos del usuario
    db.query('SELECT nombre, email, cargo FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Devolver los datos del usuario
        const user = results[0];
        return res.status(200).json({
            nombre: user.nombre,
            email: user.email,
            cargo: user.cargo,
        });
    });
});

// Ruta para obtener todos los perfiles de usuario
app.get('/getAllProfiles', (req, res) => {
    // Consultar todos los usuarios de la base de datos
    db.query('SELECT nombre, email, cargo FROM usuarios', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Verificar si hay usuarios
        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron usuarios' });
        }

        // Devolver los datos de todos los usuarios
        return res.status(200).json(results);
    });
});

app.post('/updateCargo', (req, res) => {
    const { email, newCargo } = req.body;
    db.query('UPDATE usuarios SET cargo = ? WHERE email = ?', [newCargo, email], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al actualizar el cargo' });
        }
        res.status(200).json({ success: true, message: 'Cargo actualizado correctamente' });
    });
});

// Ruta para obtener las facturas generadas
app.get('/getFacturas', (req, res) => {
    // Consulta a la base de datos para obtener las facturas
    db.query('SELECT * FROM facturas', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener las facturas' });
        }

        // Si no hay facturas, enviar una lista vacía
        res.status(200).json(results);
    });
});

// Ruta para guardar la factura
app.post('/guardarFactura', (req, res) => {
    const { nombre_cliente, productos, total } = req.body;

    // Verificar que los datos sean correctos
    if (!nombre_cliente || !productos || productos.length === 0 || !total || total <= 0) {
        return res.status(400).json({ error: 'Faltan datos necesarios para la factura o el total es incorrecto' });
    }

    // Insertar la factura en la base de datos
    const queryFactura = 'INSERT INTO facturas (nombre_cliente, total) VALUES (?, ?)';
    db.query(queryFactura, [nombre_cliente, total], (err, results) => {
        if (err) {
            console.error('Error al guardar la factura:', err);
            return res.status(500).json({ error: 'Error al guardar la factura' });
        }

        const facturaId = results.insertId; // Obtener el ID de la factura recién insertada

        // Ahora insertar los productos de la factura en la tabla 'productos_factura'
        const queryProductos = 'INSERT INTO productos_factura (factura_id, producto, cantidad, precio) VALUES ?';
        
        // Preparar los datos para insertar en la base de datos
        const productosData = productos.map(p => [facturaId, p.producto, p.cantidad, p.precio]);

        db.query(queryProductos, [productosData], (err) => {
            if (err) {
                console.error('Error al guardar los productos:', err);
                return res.status(500).json({ error: 'Error al guardar los productos' });
            }

            // Todo ha ido bien, devolver éxito
            res.status(200).json({ message: 'Factura guardada exitosamente' });
        });
    });
});

// Ruta para obtener todas las facturas generadas
app.get('/getAllFacturas', (req, res) => {
    db.query('SELECT * FROM facturas', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar las facturas' });
        }

        res.status(200).json(results);
    });
});


app.post('/editarPerfil', (req, res) => {
    const { nombre, email, password, confirm_password } = req.body;

    // Eliminar espacios al principio y al final del correo electrónico
    const emailTrimmed = email.trim();

    // Validación de contraseñas
    if (password !== confirm_password) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    // Verificar que el correo electrónico existe en la base de datos
    db.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [emailTrimmed], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar el correo en la base de datos', error: err });
        }

        console.log('Resultados de la consulta:', results); // Verificar los resultados de la consulta

        if (results.length === 0) {
            return res.status(404).json({ message: 'El usuario con ese correo no existe' });
        }

        // Si se proporciona una nueva contraseña, encriptarla
        let updateValues = [nombre];
        let query = 'UPDATE usuarios SET nombre = ?';

        if (password && confirm_password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al encriptar la contraseña' });
                }

                // Si la contraseña se ha cambiado, agregarla a la actualización
                updateValues.push(hashedPassword);
                query += ', password = ?';
                
                updateValues.push(emailTrimmed);  // El correo es necesario para la condición WHERE
                query += ' WHERE email = ?';

                // Ejecutar la actualización en la base de datos
                db.query(query, updateValues, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al actualizar el perfil', error: err });
                    }
                    res.status(200).json({ message: 'Perfil actualizado correctamente' });
                });
            });
        } else {
            // Si no hay cambio de contraseña, solo actualizamos el nombre
            updateValues.push(emailTrimmed);
            query += ' WHERE email = ?';

            db.query(query, updateValues, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al actualizar el perfil', error: err });
                }
                res.status(200).json({ message: 'Perfil actualizado correctamente' });
            });
        }
    });
});


app.post('/api/products', (req, res) => {
    const { name, mark, quantity, price } = req.body;
  
    const query = 'INSERT INTO products (name, mark, quantity, price) VALUES (?, ?, ?, ?)';
    db.query(query, [name, mark, quantity, price], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Producto agregado', productId: result.insertId });
    });
  });
  
  // Endpoint para obtener todos los productos
  // Ruta para obtener todos los productos
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(result);
    });
});

// Ruta para agregar un producto
app.post('/api/products', (req, res) => {
    const { name, mark, quantity, price } = req.body;

    const query = 'INSERT INTO products (name, mark, quantity, price) VALUES (?, ?, ?, ?)';
    db.query(query, [name, mark, quantity, price], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Producto agregado', productId: result.insertId });
    });
});

// Ruta para actualizar un producto
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, mark, quantity, price } = req.body;

    const query = 'UPDATE products SET name = ?, mark = ?, quantity = ?, price = ? WHERE id = ?';
    db.query(query, [name, mark, quantity, price, id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Producto no encontrado' });
        return;
      }
      res.json({ message: 'Producto actualizado' });
    });
});

// Ruta para agotar un producto (poner la cantidad a 0)
app.put('/api/products/outofstock/:id', (req, res) => {
    const { id } = req.params;

    const query = 'UPDATE products SET quantity = 0 WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Producto no encontrado' });
        return;
      }
      res.json({ message: 'Producto agotado' });
    });
});

// Ruta para reactivar un producto (sumar 10 unidades a la cantidad)
app.put('/api/products/reactivate/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const product = result[0];
        const newQuantity = product.quantity + 10;

        const updateQuery = 'UPDATE products SET quantity = ? WHERE id = ?';
        db.query(updateQuery, [newQuantity, id], (err, updateResult) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: `Producto reactivado. Nueva cantidad: ${newQuantity}` });
        });
    });
});
// Ruta para listar productos
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(result);
    });
});
// Ruta para obtener un producto por su ID
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        res.json(result[0]);
    });
});

// Ruta para actualizar un producto
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, mark, quantity, price } = req.body;

    const query = 'UPDATE products SET name = ?, mark = ?, quantity = ?, price = ? WHERE id = ?';
    db.query(query, [name, mark, quantity, price, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        res.json({ message: 'Producto actualizado' });
    });
});

  


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
