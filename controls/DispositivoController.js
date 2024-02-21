var models = require('../models/');
var cuenta = models.cuenta;
var persona = models.persona;
var dispositivo = models.dispositivo;
var disp = models.dispositivo;
var medicion = models.medicion;
var controlAcces = models.controlAcces;
const { body, validationResult, check } = require('express-validator');
const bcypt = require('bcrypt');
const salRounds = 8;
let jwt = require('jsonwebtoken');
//const medicion = require('../models/medicion');
const axios = require('axios')


const moment = require('moment-timezone');

class DispositivoController {

  constructor() {
    // Llamar a guardarMedicion automáticamente cada 30 minutos al inicializar el controlador
    this.programarGuardadoMedicion();
  }
  /// Obtener Dispositivo
  async obtener(req, res) {
    const external = req.params.external;
    var listar = await dispositivo.findOne({
      where: { external_id: external },
      include: {
        model: medicion,
        as: 'medicion',
        attributes: ['uv', 'fecha']
      },
      attributes: ['identificador', 'latitud', 'longitud'],
    });
    if (listar === null) {
      res.status(404).json({ msg: 'Dispositivo no encontrado', code: 404 });
      listar = {};
    } else {
      res.status(200);
      res.json({ msg: 'OK!', code: 200, info: listar });
    }
  }




  async listar(req, res) {
    var listar = await medicion.findAll({
      attributes: ['uv', 'fecha'],

    });
    res.json({ msg: 'OK!', code: 200, info: listar });
  }


  //////////////
  /////// APlicar cambios para listar los dispositivos
  async listarDisp(req, res) {
    var listar = await dispositivo.findAll({
      attributes: ['latitud', 'longitud', 'nombre', 'activo'],

    });
    res.json({ msg: 'OK!', code: 200, info: listar });
  }

  //ACTUALIZAR DATOS EXTERNOS

  async actualizarDatosExternos(req, res) {
    try {
      // Obtener datos de la API
      const response = await axios.get('https://computacion.unl.edu.ec/uv/api/listar');
      const datosExternos = response.data.dispositivos;

      // Recorrer los datos y actualizarlos
      for (const dispositivo of datosExternos) {
        try {
          // Buscar dispositivo por external_id
          const existingDevice = await disp.findOne({ where: { external_id: dispositivo.external_id } });

          // Si el dispositivo existe, actualizarlo
          if (existingDevice) {
            const updatedData = {
              nombre: dispositivo.nombre,
              latitud: dispositivo.latitud,
              longitud: dispositivo.longitud,
              activo: dispositivo.activo,
            };

            // Comparar y actualizar solo los campos que hayan cambiado
            for (const key in updatedData) {
              if (existingDevice[key] !== updatedData[key]) {
                existingDevice[key] = updatedData[key];
              }
            }

            await existingDevice.save();
          } else {
            // Si no existe, crear un nuevo dispositivo
            let transaction = await models.sequelize.transaction();
            await disp.create(dispositivo, transaction);
            await transaction.commit();
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      }

      res.status(200).json({ msg: 'Datos actualizados correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Error al obtener datos externos' });
    }
  }

  //Guardaar MEdicion cada 30min
  async guardarMedicion() {
    try {
      // Obtener la fecha y hora actual en Ecuador
      const fechaHoraActual = moment().tz('America/Guayaquil').format();

      // Hacer una solicitud HTTP para obtener los datos del enlace proporcionado
      const response = await axios.get('https://computacion.unl.edu.ec/uv/api/medicionDispositivos');

      // Extraer las últimas mediciones del cuerpo de la respuesta JSON
      const ultimasMediciones = response.data.ultimasMediciones;

      // Filtrar y validar las mediciones
      const medicionesValidas = [];
      ultimasMediciones.forEach(dispositivo => {
        dispositivo.medicions.forEach(medicion => {
          if (medicion.uv > 0 && medicion.uv <= 25) {
            medicionesValidas.push(medicion.uv);
          }
        });
      });

      // Calcular el promedio general de todas las mediciones
      const promedioGeneral = medicionesValidas.reduce((acc, val) => acc + val, 0) / medicionesValidas.length;

      // Filtrar las mediciones que están dentro del 20% del promedio general
      const medicionesFiltradas = medicionesValidas.filter(valor => Math.abs(valor - promedioGeneral) <= 0.2 * promedioGeneral);

      // Calcular el promedio solo utilizando las mediciones filtradas
      const promedioUV = medicionesFiltradas.reduce((acc, val) => acc + val, 0) / medicionesFiltradas.length;

      // Guardar el promedio UV junto con la fecha actual en la base de datos
      await medicion.create({
        uv: promedioUV,
        fecha: fechaHoraActual,
      });

      // Imprimir un mensaje indicando que el promedio UV ha sido guardado correctamente
      console.log('Promedio UV guardado correctamente:', {
        fechaHoraActual: fechaHoraActual,
        promedioUV: promedioUV
      });
    } catch (error) {
      // Si ocurre un error al realizar la solicitud HTTP o al guardar los datos, imprimir un mensaje de error
      console.error('Ha ocurrido un error al guardar el promedio UV:', error);
    }
  }



  programarGuardadoMedicion() {
    // Ejecutar guardarMedicion automáticamente cada 30 minutos
    setInterval(() => {
      this.guardarMedicion();
    }, 30 * 60 * 1000); // 30 minutos en milisegundos
  }

  ///
  async obtenerDatosExternos(req, res) {
    try {
      // Obtener datos de la API
      const response = await axios.get('https://computacion.unl.edu.ec/uv/api/medicionDispositivos');
      const datosExternos = response.data.ultimasMediciones;

      // Verificar si hay datos disponibles
      if (datosExternos.length === 0) {
        // Si no hay datos, devolver un mensaje indicando que no hay datos disponibles
        return res.status(200).json({ msg: 'No hay datos disponibles para guardar' });
      }

      // Recorrer los datos y guardarlos
      for (const dispositivo of datosExternos) {
        try {
          // Verificar si ya existe un dispositivo con la misma latitud, longitud y nombre
          const dispositivoExistente = await disp.findOne({
            where: {
              latitud: dispositivo.latitud,
              longitud: dispositivo.longitud,
              nombre: dispositivo.nombre
            }
          });

          // Si ya existe un dispositivo con los mismos datos, enviar un mensaje indicando que ya está registrado
          if (dispositivoExistente) {
            return res.status(400).json({ msg: 'El dispositivo ya está registrado' });
          }

          // Crear un objeto con los datos del dispositivo
          const data = {
            nombre: dispositivo.nombre,
            latitud: dispositivo.latitud,
            longitud: dispositivo.longitud,
            external_id: dispositivo.external_id,
            activo: true, // Establecer el dispositivo como activo por defecto
          };

          // Comenzar una transacción
          let transaction = await models.sequelize.transaction();

          // Crear el dispositivo en la base de datos dentro de la transacción
          await disp.create(data, { transaction });

          // Commit de la transacción si se crea el dispositivo correctamente
          await transaction.commit();
        } catch (error) {
          console.error('Error al crear el dispositivo:', error.message);

          // Deshacer la transacción si hay un error al crear un dispositivo
          await transaction.rollback();

          // Devolver un mensaje de error al cliente
          return res.status(500).json({ msg: 'Error al crear dispositivos en la base de datos' });
        }
      }

      // Devolver un mensaje de éxito al cliente
      return res.status(200).json({ msg: 'Datos guardados correctamente' });
    } catch (error) {
      console.error('Error al obtener datos externos:', error.message);

      // Devolver un mensaje de error al cliente
      return res.status(500).json({ msg: 'Error al obtener datos externos de la API externa' });
    }
  }



}
module.exports = DispositivoController;


