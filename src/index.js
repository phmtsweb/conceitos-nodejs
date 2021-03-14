const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require("uuid");
const validator = require("is-my-date-valid");
// const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const validate = validator({ format: "YYYY-MM-DD" });

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;
    const user = users.find(user => user.username === username);
    if (!user) {
        return response.status(404).json("User not found!");
    }

    request.user = user;
    return next();

}

function dateValidation(date) {
    return validate(date);
}

function todoIsInvalid(title, deadline) {
    if (!title || title.trim() === "" || !deadline) {
        return { error: "One or more parameters are missing or empty!" };
    }
    // if (!dateValidation(deadline)) {
    //     return { error: "The date format is invalid!" };
    // }
    return undefined;
}

function getTodoById(request, response, next) {
    const { user, params: { id } } = request;
    const todo = user.todos.find(todo => todo.id === id);
    if (!todo) {
        return response.status(404).json({ error: "To do not found!" });
    }
    request.todo = todo;
    return next();
}

app.post('/users', (request, response) => {
    const { name, username } = request.body;
    if (!name || name.trim() === "" || !username || username.trim() === "") {
        return response.status(400).json({ error: "One or more parameters are missing or empty!" });
    }
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return response.status(400).json({ error: "User already exists!" });
    }
    const user = {
        id: uuidv4(),
        name,
        username,
        todos: []
    };
    users.push(user);

    return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request;
    return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
    const { user, body: { title, deadline } } = request;
    const validation = todoIsInvalid(title, deadline);
    if (validation) {
        return response.status(400).json(validation);
    }
    const todo = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
    };
    user.todos.push(todo);

    return response.status(201).json(todo);

});

app.put('/todos/:id', checksExistsUserAccount, getTodoById, (request, response) => {
    const { todo, body: { title, deadline } } = request;
    const validation = todoIsInvalid(title, deadline);
    if (validation) {
        return response.status(400).json(validation);
    }
    todo.title = title;
    todo.deadline = deadline;
    return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, getTodoById, (request, response) => {
    const { todo } = request;
    todo.done = true;
    return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, getTodoById, (request, response) => {
    const { user, todo } = request;
    user.todos.splice(todo, 1);
    return response.status(204).send();
});

module.exports = app;