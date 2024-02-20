var express = require('express');
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const PersonaController = require('../controls/PersonaController');
var personaController = new PersonaController();
const CuentaController = require('../controls/CuentaController');
var cuentaController = new CuentaController();
const DispositivoController = require('../controls/DispositivoController');
const SolicitudController = require('../controls/SolicitudController');
var solicitudController = new SolicitudController();
var dispController = new DispositivoController();
const storage_archivo = (dir) => multer.diskStorage({
  destination: path.join(__dirname,'../public/archivos'+dir),
  filename: (req, file, cb) => {
    const partes = file.originalname.split('.');
    const extension = partes[partes.length - 1];
    cb(null, uuid.v4()+"."+extension);
  }
 
});

const extensiones_aceptadas_archivo = (req, file, cb) => {
  const allowedExtensions = ['.pdf','.docx', '.xlsx'];
  const ext = path.extname(file.originalname);
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, DOCX y XLSX.'));
  }
};

const upload_archivo_practica = multer({ storage: storage_archivo('/practicas'), limits: {
  fileSize: 2 * 1024 * 1024 // 2 MB en bytes
},fileFilter: extensiones_aceptadas_archivo});

var auth = function middleware(req, res, next) {
  const token = req.headers['x-api-token'];
  //console.log(req.headers);
  if (token) {
    require('dotenv').config();
    const llave = process.env.KEY;
    jwt.verify(token, llave, async (err, decoded) => {
      if (err) {
        console.log('aqui', err);
        res.status(401);
        res.json({ msg: "Token no valido!", code: 401 });
      } else {
        var models = require('../models');
        var cuenta = models.cuenta;
        req.decoded = decoded;
        console.log("Aca\n\n");
        console.log(decoded);
        let aux = await cuenta.findOne({ where: { external_id: req.decoded.external } });
        if (aux) {
          next();
        } else {
          res.status(401);
          res.json({ msg: "Token no valido!", code: 401 });
        }
      }

    });
  } else {
    res.status(401);
    res.json({ msg: "No existe token!", code: 401 });
  }
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.json({ "version": "1.0", "name": "pis-uv-backend" });
});
//Sesion
router.post('/sesion', [
  body('correo', 'Ingrese un correo valido').exists().not().isEmpty().isEmail(),
  body('clave', 'Ingrese una clave valido').exists().not().isEmpty(),
], cuentaController.sesion)

//Get persona
router.get('/personas', personaController.listar);
router.get('/personas/obtener/:external', personaController.obtener);
router.get('/personas/obtener/iden/:iden', personaController.obtenerExt);
router.get('/personas/buscar/:apellidos', personaController.obtenerPorApellidos);


//Get dispositivo
router.get('/disp', dispController.listar);
//router.get('/dispExt', dispController.obtenerDatosExternos);
router.get('/dispActualizar', dispController.actualizarDatosExternos);
router.get('/listarDips', dispController.listarDisp);
router.get('/actualizarMediciones', dispController.guardarMedicion);
router.get('/dispActualizar', dispController.actualizarDatosExternos);
router.get('/listarDips', dispController.listarDisp);

//get mediciones
//router.get('/mediciones',dispController.listarMediciones);
router.get('/mediciones/guardar',dispController.guardarMedicion);

//get solicitudes
router.get('/solicitudes',solicitudController.listar);

//post solicitudes
router.post('/solicitudes/aceptar',solicitudController.crearPersonaYCuenta);
router.post('/solicitudes/crear',[
  body('apellidos', 'Ingrese sus apellidos').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50"),
  body('nombres', 'Ingrese sus nombres').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50"),
  body('correo', 'Ingrese su correo').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50"),
  body('contrasenia', 'Ingrese su contrasenia').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50")
],solicitudController.crear)
//post persona
router.post('/personas/guardar', [
  body('apellidos', 'Ingrese sus apellidos').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50"),
  body('nombres', 'Ingrese sus nombres').trim().exists().not().isEmpty().isLength({ min: 3, max: 50 }).withMessage("Ingrese un valor mayor o igual a 3 y menor a 50"),
], personaController.guardar);

router.post('/personas/modificar', personaController.modificar);
router.post('/cuenta/toggle', cuentaController.toggleCuenta);
module.exports = router;
