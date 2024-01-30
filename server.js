/*
  Código que levanta el sitio web con Node y Express que permite al usuario:
     - iniciar sesión con su usario y contraseña
     - seleccionar una imagen de informe ECG 
     - previsualizar la imagen del informe de ECG
     - Enviar la información para su procesamiento, previa aceptación de las condiciones y términos
       de uso de la aplicación
     - Una ves enviada la imagen, se muestra la lista en el resultado de la clasificación
     - La información del resultado se almacena en una colección MongoDB
     - El usuario finaliza la consulta regresando a la pantalla principal
*/

/* Librerías requeridas */
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const User = require('./models/User'); 
const multer = require('multer');
const axios = require('axios'); 

/* 
   Se coloca como global el nombre del usuario para que se integre en la colección
   de MongoDB. Este es el nombre de usuario que se firmó en la aplicación

   Esto se deberá modificar habilitando sesiones con Express
*/
let nom_usuario;

/* Conexión a MongoDB Ajustar la cadena de conexión para LOCAL o MongoATLAS */
uri_local = 'mongodb://localhost:27017/ecg_analisis';
uri_cloud = 'mongodb+srv://usuario01:usuario01@cluster0.qyevgk6.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(uri_local);

/* Configuraciones */
app.use(express.urlencoded({ extended: true })); // Para parsear el cuerpo de las peticiones POST

/* Ruta '/' de inicio para mostrar el login a la plataforma */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'login.html'))
});

/* Ruta '/principal' posterior a la confirmación del inicio de sesión */
app.post('/principal', async (req, res) => {
    /* Valida que exista el usuario */
    const { username, password } = req.body;
    const user = await User.findOne({ usuario: username, pass: password });

    nom_usuario = user;

    if (user) {
        /* Actualiza la página a la principal */
        res.sendFile(path.join(__dirname, 'public', 'principal.html'));
    } else {
        /* si no existe, lo mantiene en el login */
        res.redirect('/');
    }
});

// Multer para procesar los archivos entrantes
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

/* Ruta '/upload' para subir el archivo de imagen adjuntado */
app.post('/upload', upload.single('image'), async (req, res) => {
    const Registro = require('./models/Registro'); 

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Convertir imagen a Base64
    const imageBase64 = Buffer.from(req.file.buffer).toString('base64');

    // Preparar el cuerpo de la petición para FastAPI
    const fastApiRequestBody = {
        imageBase64: imageBase64
    };

    try {
        /* Hacer la llamada al endpoint de FastAPI que va a procesar la imagen */
        const fastApiResponse = await axios.post('http://127.0.0.1:8000/analyze_ecg/', fastApiRequestBody);
        
        /* Respuesta de FastAPI */
        const dataFromFastApi = fastApiResponse.data;
        
        // Guardar en MongoDB
        const newRegistro = new Registro({
            totalLatidos: dataFromFastApi.totalLatidos,
            latidos: dataFromFastApi.latidos,
            imageBase64: dataFromFastApi.imageBase64, 
            fecha: new Date(), 
            usuario: nom_usuario, 
            hora: new Date().toLocaleTimeString() 
        });

        await newRegistro.save();
        res.json(dataFromFastApi); /* Enviar respuesta al cliente con la información procesada por FastAPI */

    } catch (error) {
        console.error('Error al llamar a FastAPI:', error);
        res.status(500).send(error);
    }
});

/* Ruta '/results' que muestra el resumen de los resultados del análisis del ECG */
app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'results.html'))
    //res.render('login.html');
});

/* Método GET para desplegar la página principal */
app.get('/principal', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'principal.html'))
    //res.render('login.html');
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


//Para ejecutarlo:  node server.js
//Desde:  /Users/acm/Documents/Cursos/Health/Final/codigo/web_analisis_ecg
