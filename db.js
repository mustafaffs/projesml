import { Sequelize, Op, Model, DataTypes } from 'sequelize'


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.db',
    logging: false,    
})


const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userType: {
        type: DataTypes.NUMBER,   // 1 admin  // 2 user
        allowNull: false
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
})

const trackData = sequelize.define('TrackData', {
    seker: {
        type: DataTypes.FLOAT
    },
    tansiyon: {
        type: DataTypes.INTEGER
    },
    kolestrol: {
        type: DataTypes.FLOAT
    },
    date: {
        type: DataTypes.BIGINT
    },
    user: {
        type: DataTypes.BIGINT
    }
}, {
    timestamps: false
})




export { sequelize, Op, Model, DataTypes }
export { User, trackData }