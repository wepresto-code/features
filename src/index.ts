import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

// Connect to the database using the DATABASE_URL environment
//   variable injected by Railway
const pool = new pg.Pool();

const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT NOW()");
  res.send(`Hey, the server is up and the time from the DB is ${rows[0].now}`);
});

// Obtener todas las tareas
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las tareas" });
  }
});

// Obtener una tarea por ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la tarea" });
  }
});

// Crear una tarea
app.post("/tasks", async (req, res) => {
  const { name, description, author, category_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (name, description, author, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, author, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la tarea" });
  }
});

// Actualizar una tarea
app.put("/tasks/:id", async (req, res) => {
  const { name, description, author, ranking } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET name = $1, description = $2, author = $3, ranking = $4 WHERE id = $5 RETURNING *",
      [name, description, author, ranking, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la tarea" });
  }
});

// Eliminar una tarea
app.delete("/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json({ message: "Tarea eliminada correctamente" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la tarea" });
  }
});

// Sumar o restar puntos al ranking de una tarea
app.patch("/tasks/:id/ranking", async (req, res) => {
  const { points } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET ranking = ranking + $1 WHERE id = $2 RETURNING *",
      [points, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al actualizar el ranking de la tarea" });
  }
});

// Crear una categoría
app.post('/categories', async (req, res) => {
    const { name } = req.body;
    try {
      const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la categoría' });
    }
  });
  
  // Obtener todas las categorías
  app.get('/categories', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las categorías' });
    }
  });

app.listen(port, () => {
  console.log(`Features listening at http://localhost:${port}`);
});
