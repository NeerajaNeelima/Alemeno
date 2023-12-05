const{
    createPool
}=require('mysql');
const pool=createPool({
    host:"localhost",
    user:"root",
    password:"",
    database:"alemendo",
    connectionLimit:10
})
pool.query('select * from customer_data',(err,result,fields)=>{
    if(err){
        return console.log(err);
    }
    return console.log(result)
})
pool.query('select * from loan_data',(err,result,fields)=>{
    if(err){
        return console.log(err);
    }
    return console.log(result)
})