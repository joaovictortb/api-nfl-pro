/**
 * Servidor Node (Express) para rodar a API localmente.
 * Use: cd api && npm install && npm run dev
 * A API ficará em http://localhost:3001
 */
import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  Config:  http://localhost:${PORT}/api/automation-config`);
  console.log(`  Posts:   http://localhost:${PORT}/api/posts-history`);
  console.log(`  Logs:    http://localhost:${PORT}/api/automation-logs`);
});
