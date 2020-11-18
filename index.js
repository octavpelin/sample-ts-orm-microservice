
const db = new sqlite3.Database('./emp_database.db', (err) => {
    if(err) {
        console.error("Error opening database " + err.message)
    } else {
        db.run(
            'CREATE TABLE employees( \
            employee_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
            last_name NVARCHAR(20) NOT NULL,\
            first_name NVARCHAR(20) NOT NULL,\
            title NVARCHAR(20),\
            address NVARCHAR(100),\
            country_code INTEGER\
            )',
            (err) => {
                if (err) {
                    console.log("Table already exists." + err)
                } else {
                    let insert = 'INSERT INTO employees (\
                        last_name,\
                        first_name,\
                        title,\
                        address,\
                        country_code) \
                        VALUES (?,?,?,?,?)\
                        '
                    db.run(insert, ["Chandan", "Praveen", "SE", "Address 1", 1])
                    db.run(insert, ["Samanta", "Mohim", "SSE", "Address 2", 1])
                    db.run(insert, ["Gupta", "Pinky", "TL", "Address 3", 1])
                }
        })
    }
})

// GET
app.get("/employees/:id", (req, res, _) => {
    var id = [req.params.id]
    db.get(`SELECT * FROM employees WHERE employee_id = ?`,
        id,
        (err, row) => {
            if(err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.status(200).json(row);
        }
    )
})

app.get("/employees", (_req, res, _next) => {
    db.all("SELECT * FROM employees", [], (err, rows) => {
        if(err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.status(200).json({rows})
    })
})

// POST
app.post("/employees/", (req, res, _next) => {
    var body = req.body;
    console.debug(body)
    db.run(`INSERT INTO employees (last_name, first_name, title, address, country_code) VALUES (?,?,?,?,?)`,
    [body.last_name, body.first_name, body.title, body.address, body.country_code],
    function(err, _result) {
        if(err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.status(201).json({ "employee_id": this.lastID })
    })
})

// UPDATE
app.patch("/employees/", (req, res, _next) => {
    var body = req.body;
    console.debug(body)
    db.run(`UPDATE employees SET last_name = ?, first_name = ?, title = ?, address = ?, country_code = ? WHERE employee_id = ?`,
        [body.last_name, body.first_name, body.title, body.address, body.country_code, body.employee_id],
        function(err, _result) {
            if(err) {
                res.status(400).json({"error": err.message });
                return;
            }
            res.status(200).json({updated: this.changes});
        }    
    )
})

// DELETE
app.delete("/employees/:id", (req, res, _next) => {
    db.run(`DELETE FROM employees WHERE employee_id = ?`,
        req.params.id,
        function (err, _result) {
            if(err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(200).json({deleted: this.changes})
        }
    )
})