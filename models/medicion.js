'use strict';
const { UUIDV4 } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const medicion = sequelize.define('medicion', {
        uv: { type: DataTypes.STRING(50), allowNull: false},
        fecha: { type: DataTypes.DATE, allowNull: false},
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    }, {
        freezeTableName: true
    });

    medicion.associate = function (models){
        medicion.belongsTo(models.dispositivo, {foreignKey: 'id_dispositivo'});
    }
    
    return medicion;
};
