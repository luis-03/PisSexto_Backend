'use strict';
const { UUIDV4 } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const cuenta = sequelize.define('cuenta', {
        usuario: { type: DataTypes.STRING(50), allowNull: false, unique:true },
        correo: { type: DataTypes.STRING(50), allowNull: false, unique:true },
        clave: { type: DataTypes.STRING(100), allowNull: false },
        rol: { type: DataTypes.ENUM("ADMIN", "USER"), allowNull: false,defaultValue: "USER" },
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        estado: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        freezeTableName: true
    });

    cuenta.associate = function (models){
        cuenta.belongsTo(models.persona, {foreignKey: 'id_persona'});
        cuenta.hasMany(models.token, { foreignKey: 'id_cuenta', as: 'token'});
    }
    return cuenta;
};
