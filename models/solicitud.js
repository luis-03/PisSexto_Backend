'use strict';
const { UUIDV4 } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const solicitud = sequelize.define('solicitud', {
        nombres: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        apellidos: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        correo: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        contrasenia: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        telefono: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        fecha_nacimiento: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        ocupacion: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        organizacion: {type: DataTypes.STRING(50),defaultValue: "NO_DATA"},
        direccion: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        estado: { type: DataTypes.ENUM("ACEPTADO", "ESPERA","DENEGADO"), allowNull: false,defaultValue: "ESPERA" }
    }, {
        freezeTableName: true
    });

    return solicitud;
};