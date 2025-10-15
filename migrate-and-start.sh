#!/bin/sh

echo "🔄 Running database migrations..."
npx sequelize-cli db:migrate

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
  echo "🚀 Starting application..."
  node server.js
else
  echo "❌ Migrations failed"
  exit 1
fi
