'use strict';
const { UUIDV4 } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const token = sequelize.define('token', {
        token: { type: DataTypes.STRING(500), allowNull: false },
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    }, {
        freezeTableName: true
    });

    token.associate = function (models){
        token.belongsTo(models.persona, {foreignKey: 'id_cuenta'});
    }
    return token;
};
