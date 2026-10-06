const db = require("./backend/config/database");

db.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
    ["users"]
)
.then(result => {
    console.table(result.rows);
})
.catch(error => {
    console.error(error);
})
.finally(() => {
    process.exit();
});
