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

  /// Obtener Dispositivo
    async obtener(req, res) {
        const external = req.params.external;
        var listar = await dispositivo.findOne({
            where: { external_id: external },
            include: {
                model: medicion,
                as: 'medicion',
                attributes: ['uv','fecha']
            },
            attributes: ['identificador','latitud','longitud'],
        });
        if (listar === null) {
            res.status(404).json({ msg: 'Dispositivo no encontrado', code: 404 });
            listar = {};
        }else{
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
          attributes: ['latitud','longitud','nombre','activo'],
          
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

    //OBTENER MEDICION
    // Obtener MEDICION
    // Obtener MEDICION
    async guardarMedicion(req, res) {
        try {
            // Obtener datos de la API
            const response = await axios.get('https://computacion.unl.edu.ec/uv/api/medicionDispositivos');
            const datosExternos = response.data.ultimasMediciones;
    
            // Obtener la fecha y hora actual
            const now = new Date();
            const nowISOString = now.toISOString(); // Convertir a formato ISO para comparación
    
            // Agregar la fecha actual al JSON de respuesta
            const datosConFechaActual = {
                ...response.data,
                fechaActualSistema: nowISOString
            };
    
            // Variables para calcular el promedio
            let totalUV = 0;
            let numMedicionesValidas = 0;
            let valoresUV = [];
    
            // Iterar sobre las mediciones externas y guardarlas
            for (const medicionExterna of datosExternos) {
                try {
                    // Obtener el valor de UV y redondearlo a 2 decimales
                    let uv = parseFloat(medicionExterna.medicions[0].uv);
                    uv = Math.round(uv * 100) / 100;
    
                    // Agregar el valor de UV al array de valores
                    valoresUV.push(uv);
    
                    // Incrementar el contador de mediciones válidas
                    numMedicionesValidas++;
                } catch (error) {
                    console.error('Error al procesar la medición:', error.message);
                    throw error;
                }
            }
    
            // Calcular el valor máximo y mínimo de los valores de UV
            const maxUV = Math.max(...valoresUV);
            const minUV = Math.min(...valoresUV);
    
            // Calcular el umbral del 20%
            const umbral = (maxUV - minUV) * 0.2;
    
            // Filtrar los valores de UV que estén dentro del rango del 20%
            const valoresFiltrados = valoresUV.filter(uv => uv >= minUV - umbral && uv <= maxUV + umbral);
    
            // Calcular el promedio de los valores filtrados
            const promedioUV = valoresFiltrados.reduce((acc, val) => acc + val, 0) / valoresFiltrados.length;
    
            // Redondear el promedio a 2 decimales
            const promedioUVRounded = Math.round(promedioUV * 100) / 100;
    
            // Guardar el promedio redondeado en la base de datos
            await medicion.create({
                uv: promedioUVRounded,
                fecha: now,
                dispositivoId: 1 // Aquí debes reemplazar con el ID del dispositivo correspondiente
            });
    
            // Agregar el promedio al JSON de respuesta
            return res.status(200).json({ 
                ...datosConFechaActual,
                msg: 'Mediciones de uv y fecha guardadas correctamente',
                promedioUV: promedioUVRounded
            });
        } catch (error) {
            console.error('Error al obtener datos externos:', error.message);
            res.status(500).json({ msg: 'Error al obtener datos externos' });
        }
    }
    
    







  
  
  
  
  
    
    
    

  /////Guardar DIpsotiviovs
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

