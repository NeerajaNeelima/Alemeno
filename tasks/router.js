// routes.js

const express = require('express');
const router = express.Router();
const { Customer, Loan } = require('../Model/model'); // Import Sequelize models
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
// Ingest data from Excel files
//const ingestData = require('./ingestData'); // Define this function

// API to trigger data ingestion
/*router.post('/ingest-data', async (req, res) => {
  try {
    await ingestData();
    res.status(200).json({ message: 'Data ingestion complete' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});*/
router.get('/get-customers', async (req, res) => {
  try {
    const query = 'SELECT * FROM customer_data';
    pool.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      const customer_Data = results.rows; 
      
      res.status(200).json(customer_Data);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/get-loan', async (req, res) => {
  try {
    const query = 'SELECT * FROM loan_data';
    pool.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      
      const loan_Data = results.rows; 
      
      res.status(200).json(loan_Data);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/register', async (req, res) => {
    try {
        
        const { first_name, last_name, phone_number, monthly_salary } = req.body;
    
        
        const approved_limit = 36 * Math.round(monthly_salary / 100000);
    
        
        const newCustomer = await customer_Data.create({
          first_name,
          last_name,
          phone_number,
          monthly_salary,
          approved_limit,
        });
    
        res.status(201).json(newCustomer);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});


router.post('/check-eligibility:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.body;
    
        // Retrieve customer's historical loan data
        const customerLoans = await Loan.findAll({
          where: { customer_id },
        });
    
        // Calculate credit score based on loan data
        const creditScore = calculateCreditScore(customerLoans);
    
        // Determine loan eligibility based on credit score
        let eligibilityStatus;
        let correctedInterestRate;
    
        if (creditScore > 50) {
          eligibilityStatus = 'Loan approved';
        } else if (creditScore > 30) {
          eligibilityStatus = 'Loan approved with interest rate > 12%';
          correctedInterestRate = 12; 
        } else if (creditScore > 10) {
          eligibilityStatus = 'Loan approved with interest rate > 16%';
          correctedInterestRate = 16;
        } else {
          eligibilityStatus = 'Loan not approved';
        }
    
        res.status(200).json({ eligibilityStatus, correctedInterestRate });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});
function calculateCreditScore(customerLoans) {
    
    const numberOfLoans = customerLoans.length;
    const creditScore = 100 - numberOfLoans * 5; // Deduct 5 points for each past loan
  
    return creditScore < 0 ? 0 : creditScore;
  }
  

router.post('/create-loan', async (req, res) => {
    try {
        const { customer_id, loan_amount, tenure, interest_rate } = req.body;
    
        // Retrieve customer's historical loan data
        const customerLoans = await loan_Data.findAll({
          where: { customer_id },
        });
    
        // Calculate credit score based on loan data
        const creditScore = calculateCreditScore(customerLoans);
    
        // Determine loan eligibility based on credit score
        let eligibilityStatus="";
        let loanApproved = false;
        let loanId = null;
        let monthlyInstallment = 0;
        let message = '';
    
        if (creditScore > 50) {
          eligibilityStatus = 'Loan approved';
          loanApproved = true;
        } else if (creditScore > 30) {
          eligibilityStatus = 'Loan approved with interest rate > 12%';
          interest_rate = Math.max(12, interest_rate);
          loanApproved = true;
        } else if (creditScore > 10) {
          eligibilityStatus = 'Loan approved with interest rate > 16%';
          interest_rate = Math.max(16, interest_rate);
          loanApproved = true;
        } else {
          eligibilityStatus = 'Loan not approved';
          message = 'Loan eligibility criteria not met';
        }
    
        // If loan is approved, check monthly installment and sum of all current EMIs
        if (loanApproved) {
          // Check if the sum of all current EMIs > 50% of monthly salary
          const monthlySalary = (await Customer.findByPk(customer_id)).monthly_salary;
          const currentEMIs = customerLoans.reduce((totalEMIs, loan) => totalEMIs + loan.monthly_repayment, 0);
          const totalEMIs = currentEMIs + (loan_amount / tenure);
    
          if (totalEMIs > 0.5 * monthlySalary) {
            loanApproved = false;
            message = 'Sum of all current EMIs exceeds 50% of monthly salary';
          } else {
            // Create a new loan record in the database
            const newLoan = await Loan.create({
              customer_id,
              loan_amount,
              tenure,
              interest_rate,
              monthly_repayment: loan_amount / tenure,
              start_date: new Date(),
              end_date:new Date()*365,
            });
    
            loanId = newLoan.id;
            monthlyInstallment = newLoan.monthly_repayment;
          }
        }
    
        res.status(201).json({
          loan_id: loanId,
          customer_id: customer_id,
          loan_approved: loanApproved,
          message: message,
          monthly_installment: monthlyInstallment,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});


router.get('/view-loan/:loan_id', async (req, res) => {
    try {
        const loanId = req.params.loan_id;
    
        // Retrieve the loan details from the database
        const loan = await Loan.findByPk(loanId);
    
        if (!loan) {
          return res.status(404).json({ error: 'Loan not found' });
        }
    
        res.status(200).json({
          loan_id: loan.id,
          customer_id: loan.customer_id,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          tenure: loan.tenure,
          start_date: loan.start_date,
          // You may include other relevant details
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});


router.post('/make-payment/:customer_id/:loan_id', async (req, res) => {
    try {
        const customerId = req.params.customer_id;
        const loanId = req.params.loan_id;
        const { payment_amount } = req.body;
    
        // Retrieve the loan details from the database
        const loan = await Loan.findByPk(loanId);
    
        if (!loan) {
          return res.status(404).json({ error: 'Loan not found' });
        }
    
        // Check if the customer ID matches the loan's customer ID
        if (loan.customer_id !== parseInt(customerId, 10)) {
          return res.status(400).json({ error: 'Invalid customer ID for the loan' });
        }
    
        // Check if the payment amount is valid
        if (isNaN(payment_amount) || payment_amount <= 0) {
          return res.status(400).json({ error: 'Invalid payment amount' });
        }
    
        // Update loan details based on the payment amount
        const remainingBalance = loan.loan_amount - loan.amount_paid;
        if (payment_amount >= remainingBalance) {
          // If payment amount is sufficient to pay off the loan
          loan.amount_paid = loan.loan_amount;
          loan.end_date = new Date();
        } else {
          // If payment amount is partial
          loan.amount_paid += payment_amount;
        }
    
        // Update the loan record in the database
        await loan.save();
    
        // Optionally, you can update the customer's current_debt field
        const customer = await Customer.findByPk(customerId);
        customer.current_debt = await calculateCurrentDebt(customerId);
        await customer.save();
    
        res.status(200).json({ message: 'Payment successful', remaining_balance: calculateRemainingBalance(loan) });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});
function calculateRemainingBalance(loan) {
    return loan.loan_amount - loan.amount_paid;
  }
  
  // Function to calculate current debt for a customer
  async function calculateCurrentDebt(customerId) {
    const customerLoans = await Loan.findAll({
      where: { customer_id: customerId },
    });
  
    return customerLoans.reduce((totalDebt, loan) => totalDebt + calculateRemainingBalance(loan), 0);
  }
  

router.get('/view-statement/:customer_id/:loan_id', async (req, res) => {
    try {
        const customerId = req.params.customer_id;
        const loanId = req.params.loan_id;
    
        // Retrieve the loan details from the database
        const loan = await Loan.findByPk(loanId);
    
        if (!loan) {
          return res.status(404).json({ error: 'Loan not found' });
        }
    
        // Check if the customer ID matches the loan's customer ID
        if (loan.customer_id !== parseInt(customerId, 10)) {
          return res.status(400).json({ error: 'Invalid customer ID for the loan' });
        }
    
        // Retrieve the payment history for the loan
        const paymentHistory = await getLoanPaymentHistory(loanId);
    
        res.status(200).json({
          loan_id: loan.id,
          customer_id: loan.customer_id,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          tenure: loan.tenure,
          start_date: loan.start_date,
          end_date: loan.end_date,
          monthly_repayment: loan.monthly_repayment,
          amount_paid: loan.amount_paid,
          remaining_balance: loan.loan_amount - loan.amount_paid,
          payment_history: paymentHistory,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});
// Function to retrieve payment history for a loan
async function getLoanPaymentHistory(loanId) {
    const payments = await Loan.findByPk(loanId, {
      attributes: ['id', 'amount_paid', 'created_at'],
      include: [{ model: Loan, as: 'payments', attributes: ['id', 'amount_paid', 'created_at'] }],
    });
  
    return payments.payments.map((payment) => ({
      payment_id: payment.id,
      amount_paid: payment.amount_paid,
      payment_date: payment.created_at,
    }));
}
module.exports = { router };

