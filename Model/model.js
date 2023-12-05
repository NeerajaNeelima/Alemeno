// models.js

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('alemendo', 'neeraja', 'neelima@143', {
  host: 'localhost',
  dialect: 'mysql', // or 'postgres' for PostgreSQL
});

const Customer = sequelize.define('Customer', {
  customer_id:{
   type:DataTypes.INTEGER,
   allowNull:false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age:{
    type:DataTypes.INTEGER,
    allowNull:false,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monthly_salary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  approved_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  current_debt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

const Loan = sequelize.define('Loan', {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    loan_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    loan_amoung:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0,
    },
    tenure:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0,
    },
    interest_rate:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0,
    },
    monthly_repayment:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0,
    },
    EMIs_paid_on_time:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0,
    },
    start_date:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    end_date:{
        type:DataTypes.STRING,
        allowNull:0,
    },
  });
 
  Customer.hasMany(Loan, { foreignKey: 'customer_id' });
  Loan.belongsTo(Customer, { foreignKey: 'customer_id' });

module.exports = { Customer,Loan };
