'use strict';
const { UUIDV4 } = require("sequelize");
const medicion = require("./medicion");
module.exports = (sequelize, DataTypes) => {
    const dispositivo = sequelize.define('dispositivo', {
        activo: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue: false},
        latitud: { type: DataTypes.DOUBLE, allowNull: false },
        longitud: { type: DataTypes.DOUBLE, allowNull: false},
        nombre: { type: DataTypes.STRING(100), allowNull: false,defaultValue:"NO_DATA"},
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    }, {
        freezeTableName: true
    });

    dispositivo.associate = function (models){
        dispositivo.hasMany(models.medicion, {foreignKey: 'id_dispositivo', as: 'medicion'});
    }
    return dispositivo;
};
