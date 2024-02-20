'use strict';
var models = require('../models/');
var cuenta = models.cuenta;
var persona = models.persona;
var solicitud = models.solicitud;
var Token = models.token;
var controlAcces = models.controlAcces;
const { body, validationResult, check } = require('express-validator');
const bcrypt = require('bcrypt');
const salRounds = 8;
let jwt = require('jsonwebtoken');
const saltRounds = 8;

class SolicitudController {

    async listar(req, res) {
        try {
            var listar = await solicitud.findAll({
                attributes: ['nombres', 'apellidos', 'correo', 'telefono', 'fecha_nacimiento', 'ocupacion', 'organizacion', 'direccion','external_id', 'ESTADO']
            });
            res.json({ msg: 'OK!', code: 200, info: listar });
        } catch (error) {
            res.status(500)
            res.json({ msg: 'ERROR!', code: 500, info: error });

        }
    }
    async obtenerExt(req, res) {
        const external = req.params.iden;
        var listar = await solicitud.findOne({
            where: { identificacion: external },

            attributes: ['external_id'],
        });
        if (listar === null) {

            listar = {};
        }
        res.status(200);
        res.json({ msg: 'OK!', code: 200, info: listar });
    }
    async crear(req, res){
        try {
            const solicitudNueva = await solicitud.create({
                nombres: req.body.nombres,
                apellidos: req.body.apellidos,
                correo: req.body.correo,
                contrasenia: req.body.contrasenia,
                telefono: req.body.telefono,
                fecha_nacimiento: req.body.fecha_nacimiento,
                ocupacion: req.body.ocupacion,
                organizacion: req.body.organizacion,
                direccion: req.body.direccion,
            });
            if (!solicitudNueva) {
                res.status(404);
                res.json({ msg: 'error', code: 404, info: "No se pudo crear solicitud" });
            } else {
                res.status(200);
                res.json({ msg: 'OK', code: 200, info: "solicitud creada" });
            
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Error al eliminar la solicitud', code: 500, info: error });             
        }
    }
   
    async eliminar(req, res) {
        try {
            const external = req.params.external_id;

            // Verificar si la solicitud existe
            const solicitudExistente = await solicitud.findOne({
                where: { identificacion: external },
            });

            if (!solicitudExistente) {
                return res.status(404).json({ msg: 'Solicitud no encontrada', code: 404 });
            }

            // Eliminar la solicitud
            await solicitud.destroy({
                where: { identificacion: external },
            });

            res.json({ msg: 'Solicitud eliminada correctamente', code: 200 });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Error al eliminar la solicitud', code: 500, info: error });
        }
    }

    async modificar(req, res) {
        try {
            const external = req.params.external_id;
            const { nuevosDatos } = req.body;

            // Verificar si la solicitud existe
            const solicitudExistente = await solicitud.findOne({
                where: { identificacion: external },
            });

            if (!solicitudExistente) {
                return res.status(404).json({ msg: 'Solicitud no encontrada', code: 404 });
            }

            // Realizar la modificación
            await solicitud.update(nuevosDatos, {
                where: { identificacion: external },
            });

            res.json({ msg: 'Solicitud modificada correctamente', code: 200 });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Error al modificar la solicitud', code: 500, info: error });
        }
    }


    async crearPersonaYCuenta(req, res) {
        try {
            
            // Crear la cuenta
            var selectedSolicitud = await solicitud.findOne({ where: { external_id: req.body.external_id } });
            
            if (!selectedSolicitud) {
                return res.status(404).json({ msg: 'Solicitud no encontrada', code: 404 });
            }

            console.log(selectedSolicitud)
            const clave = bcrypt.hashSync(selectedSolicitud.contrasenia, bcrypt.genSaltSync(saltRounds), null); // Puedes implementar esta función según tus necesidades

            const cuentaNueva = await cuenta.create({
                usuario: selectedSolicitud.correo,
                correo: selectedSolicitud.correo,
                clave: clave,
            });

            // Crear la persona
            const personaNueva = await persona.create({
                nombres: selectedSolicitud.nombres,
                apellidos: selectedSolicitud.apellidos,
                direccion: selectedSolicitud.direccion,
                telefono: selectedSolicitud.telefono,
                fecha_nacimiento: selectedSolicitud.fecha_nacimiento
                
            });
            selectedSolicitud.estado = "ACEPTADO"
            res.status(200).json({
                msg: 'Persona y cuenta creadas correctamente',
                code: 200,
                persona: personaNueva,
                cuenta: cuentaNueva,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Error al crear persona y cuenta', code: 500, info: error });
        }
    }



}
module.exports = SolicitudController;