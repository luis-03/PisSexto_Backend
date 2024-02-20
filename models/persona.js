'use strict';
const { UUIDV4 } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const persona = sequelize.define('persona', {
        nombres: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        apellidos: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        direccion: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        fecha_nacimiento: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        telefono: { type: DataTypes.STRING(50), defaultValue: "NO_DATA" },
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    }, {
        freezeTableName: true
    });
    persona.associate = function (models){
        persona.hasOne(models.cuenta, { foreignKey: 'id_persona', as: 'cuenta'});
    }
    return persona;
};