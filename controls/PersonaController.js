'use strict';
const { body, validationResult, check } = require('express-validator');
const models = require('../models/');
var persona = models.persona;
var rol = models.rol;
var persona_rol = models.persona_rol;
var cuenta = models.cuenta;
var matricula = models.matricula;
const bcrypt = require('bcrypt');
const saltRounds = 8;

class PersonaController {

    async listar(req, res) {
        var listar = await persona.findAll({
            attributes: ['apellidos', 'nombres', 'external_id', 'direccion', 'fecha_nacimiento', 'telefono'],
            include: {
                model: cuenta,
                as: 'cuenta',
                attributes: ['usuario','correo','external_id','estado']
            }
        });
        res.json({ msg: 'OK!', code: 200, info: listar });
    }

    

    async asignarRol(req,res){
        try {
            const extPersona = req.params.external_persona;
            const extRol = req.params.external_rol;
            var idPersona = await persona.findOne({
                where: {external_id : extPersona},
                attributes: ['nombres','apellidos','identificacion','id']
            });
            var idRol = await persona.findOne({
                where: {external_id : extRol},
                attributes: ['nombre','id']
            });
            if (idPersona === null || idRol === null) {
                res.status(400);
                res.json({ msg: "Datos no encontrados", code: 400 });
            } else {
                var data = {
                    "id_persona":idPersona.id,
                    "id_rol":idRol.id
                }
                let transaction = await models.sequelize.transaction();
                await persona_rol.create(data, transaction);
                await transaction.commit();
                res.json({
                    msg: "SE HAN REGISTRADO EL ROL DE LA PERSONA",
                    code: 200
                });
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            if (error.errors && error.errors[0].message) {
                res.json({ msg: error.errors[0].message, code: 200 });
            } else {
                res.json({ msg: error.message, code: 200});
            }
        }
    }

    async obtener(req, res) {
        const external = req.params.external;
        var listar = await persona.findOne({
            where: { external_id: external },
            include: {
                model: cuenta,
                as: 'cuenta',
                attributes: ['usuario']
            },
            attributes: ['apellidos', 'nombres', 'external_id', 'telefono'],
        });
        if (listar === null) {

            listar = {};
        }
        res.status(200);
        res.json({ msg: 'OK!', code: 200, info: listar });
    }

    async obtenerPorApellidos(req, res) {
        const apellidos = req.params.apellidos;
        var listar = await persona.findOne({
            where: { apellidos: apellidos},
            include: {
                model: cuenta,
                as: 'cuenta',
                attributes: ['usuario']
            },
            attributes: ['apellidos', 'nombres', 'external_id', 'direccion', 'telefono'],
        });
        if (listar === null) {

            listar = {};
        }
        res.status(200);
        res.json({ msg: 'OK!', code: 200, info: listar });
    }

    async obtenerExt(req, res) {
        const external = req.params.iden;
        var listar = await persona.findOne({
            where: { identificacion: external },

            attributes: ['external_id'],
        });
        if (listar === null) {

            listar = {};
        }
        res.status(200);
        res.json({ msg: 'OK!', code: 200, info: listar });
    }


    async guardar(req, res) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
                        var claveHash = function (clave) {
                            return bcrypt.hashSync(clave, bcrypt.genSaltSync(saltRounds), null);
                        };
                        console.log(claveHash(req.body.clave));
                        var data = {
                            apellidos: req.body.apellidos,
                            nombres: req.body.nombres,
                            direccion: req.body.direccion,
                            fecha_nacimiento: req.body.fecha_nacimiento,
                            telefono: req.body.telefono,
                            cuenta: {
                                usuario: req.body.correo,
                                correo: req.body.correo,
                                clave: claveHash(req.body.clave)
                            }
                        };
                        res.status(200);
                        let transaction = await models.sequelize.transaction();

                        try {
                            await persona.create(data, { include: [{ model: models.cuenta, as: "cuenta" }], transaction });
                            console.log('guardado');
                            await transaction.commit();
                            res.json({ msg: "Se han registrado sus datos", code: 200 });
                        } catch (error) {
                            if (transaction) await transaction.rollback();
                            if (error.error && error.error[0].message) {
                                res.json({ msg: error.error[0].message, code: 200 });
                            } else {
                                res.json({ msg: error.message, code: 200 });
                            }
                        }
                        //podemos poner persona . create o save
                        // console.log(personaAux);

                    } else {
                        res.status(400);
                        res.json({ msg: "Datos no encontrados", code: 400 });
                    }

    }

    async modificar(req, res) {
        var person = await persona.findOne({ where: { external_id: req.body.external } });
        if (person === null) {
            res.status(400);
            res.json({
                msg: "NO EXISTEN REGISTROS",
                code: 400
            });
        } else {
            var uuid = require('uuid');
            
            person.apellidos = req.body.apellidos;
            person.nombres = req.body.nombres;
            person.direccion = req.body.direccion;
            person.fecha_nacimiento = req.body.fecha_nacimiento;
            person.telefono = req.body.telefono;
            person.external_id = uuid.v4();
            var result = await person.save();
            if (result === null) {
                res.status(400);
                res.json({
                    msg: "NO SE HAN MODIFICADO SUS DATOS",
                    code: 400
                });
            } else {
                res.status(200);
                res.json({
                    msg: "SE HAN MODIFICADO SUS DATOS CORRECTAMENTE",
                    code: 200
                });
            }
        }
    }
}
module.exports = PersonaController;