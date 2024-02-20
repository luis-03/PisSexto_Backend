'use strict';
var models = require('../models/');
var cuenta = models.cuenta;
var persona = models.persona;
var Token = models.token;
var controlAcces = models.controlAcces;
const { body, validationResult, check } = require('express-validator');
const bcypt = require('bcrypt');
const salRounds = 8;
let jwt = require('jsonwebtoken');

class CuentaController {
    async sesion(req, res) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            var login = await cuenta.findOne({
                where: { correo: req.body.correo }, include: [{
                    model: models.persona, as: 'persona',
                    attributes: ['nombres', 'apellidos', 'id'],
                }]
            });
            //console.log(login)
            if (login === null) {
                res.status(400);
                
                res.json({
                    msg: "CUENTA NO ENCONTRADA",
                    code: 400
                });
                console.log(res.json);
            } else {
                //console.log(req.body.clave);
                //var clave = req.body.clave;
                //console.log(login.clave);
                //var claveUs = login.clave;

                console.log("SE HA ENCONTRADO UNA CUENTA, VERIFICANDO CONTRASENIA...");
                res.status(200);
                var isClavaValida = function (clave, claveUs) {
                    //console.log(clave);
                    //console.log(claveUs);
                    return bcypt.compareSync(claveUs, clave);
                };
                console.log(isClavaValida(login.clave, req.body.clave))

                if (login.estado) {
                    if (isClavaValida(login.clave, req.body.clave)) {
                        console.log("CLAVE CORRECTA, GENERANDO TOKEN\n\n")
                        const tokenData = {
                            external: login.external_id,
                            usuario: login.correo,
                            rol: login.rol,
                            check: true
                        };
                        require('dotenv').config();
                        const llave = process.env.KEY;
                        const token = jwt.sign(tokenData, llave);
                        const cambios = {
                            "Descripcion": "Inicio de sesion"
                        }
                        const datos = {
                            "tipo_consulta": "LEER",
                            "id_persona": login.id,
                            "data": cambios
                        }
                        //await controlAcces.create(datos);              <----pendiente
                        var nombreRol = Buffer(login.rol);
                        nombreRol = nombreRol.toString('base64');

                        console.log("REGISTRANDO TOKEN EN BD\n\n")

                        let errors = validationResult(req);
                        if (errors.isEmpty()) {
                            var data = {
                                token: token,
                                id_cuenta: login.id
                            };
                            res.status(200);
                            let transaction = await models.sequelize.transaction();
                            try {
                                await Token.create(data,transaction);
                                console.log("TOKEN REGISTRADO CORRECTAMENTE\n\n")
                                //await transaction.commit();
                                //res.json({ msg: "Se ha registrado sus datos", code: 200 });
                            } catch (error) {
                                if (transaction) await transaction.rollback();
                                if (error.errors && error.errors[0].message) {
                                    //res.json({ msg: error.errors[0].message, code: 500 });
                                    console.log({ msg: error.errors[0].message, code: 500 })
                                } else {
                                    //res.json({ msg: error.message, code: 500 });
                                    console.log({ msg: error.errors[0].message, code: 500 })
                                }
                            } 
                        }

                        res.json({ msg: 'OK!', token: token, user: login.persona.nombres + ' ' + login.persona.apellidos, code: 200, correo: login.correo, iden: login.persona.identificacion, rol: nombreRol });


                    } else {
                        res.json({
                            msg: "CLAVE INCORRECTA",
                            code: 400
                        });
                    }
                } else {
                    res.json({
                        msg: "CUENTA DESACTIVADA",
                        code: 400
                    });
                }
            }
        } else {
            res.status(400);
            res.json({ msg: "Faltan datos", code: 400 });
        }
    }

    async toggleCuenta(req, res) {
        try {
            var valCuenta = await cuenta.findOne({ where: { external_id: req.body.external_id } });
            if (valCuenta === null) {
                res.status(400);
                res.json({
                    msg: "NO EXISTEN REGISTROS",
                    code: 400
                });
            } else {
                
                valCuenta.estado = !valCuenta.estado;
                var result = await valCuenta.save();
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
        } catch (error) {
            res.status(400);
            res.json({
                msg: "NO SE HAN MODIFICADO SUS DATOS: "+error,
                code: 500
            });
        }
    }

}
module.exports = CuentaController;
