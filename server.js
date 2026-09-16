const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Отримуємо шлях до сокету або порт із process.env.PORT
const socketPath = process.env.PORT;

app.prepare().then(() => {
    // Якщо PORT передає шлях до сокету і він вже існує — видаляємо його перед запуском
    if (typeof socketPath === "string" && socketPath.startsWith("/") && fs.existsSync(socketPath)) {
        try {
            fs.unlinkSync(socketPath);
        } catch (err) {
            console.error("Помилка видалення старого сокету:", err);
        }
    }

    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Помилка обробки запиту:", err);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    });

    server.listen(socketPath || 3000, (err) => {
        if (err) throw err;
        console.log(`> Застосунок успішно запущено на ${socketPath || "port 3000"}`);
    });
});