const express = require('express');
const { send } = require('express/lib/response');
const { v4: uuidv4 } = require('uuid')

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccoutCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customers) => customers.cpf === cpf);

    if(!customer){
        return res.status(400).json({error: 'Customer not found'})
    }

    req.customer = customer;

    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount
        }else{
            return acc - operation.amount 
        }
    }, 0)

    return balance;
}

app.post("/account", (req, res) => {
    const { name, cpf } = req.body;

    const costumersAlreadyExist = customers.some((customers) => customers.cpf ===  cpf);

    if(costumersAlreadyExist){
        return res.status(400).json({error: "Costumers already exists!"})
    }

    customers.push({ 
        cpf,
        name,
        id:  uuidv4(),
        statement: [],
    });

    return res.status(201).send();
});

app.get("/statement", verifyIfExistsAccoutCPF, (req, res) => {
    const { customer } = req;
    return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccoutCPF, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccoutCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return res.status(400).send({ error: "Insufficient funds"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccoutCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === 
    new Date (dateFormat).toDateString())

    return res.json(statement);
});

app.put("/account", verifyIfExistsAccoutCPF, (req, res) => {
    const { name } =  req.body;
    const {customer} = req;

    customer.name = name;

    return res.status(201).send();
});

app.get("/account", verifyIfExistsAccoutCPF, (req, res) => {
    const {customer} = req;

    return res.json(customer);
});

app.delete("/account", verifyIfExistsAccoutCPF, (req, res) => {
    const {customer} = req;

    customers.splice(customer, 1);

    return res.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccoutCPF, (req, res) => {
    const {customer} = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
})

app.listen(3333);


