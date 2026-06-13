.PHONY: help install setup migrate seed generate run dev backend frontend stop clean build

BACKEND_DIR := backend
FRONTEND_DIR := frontend

help:
	@echo "Cal.com Clone — common commands"
	@echo ""
	@echo "  make install   Install npm dependencies (backend + frontend)"
	@echo "  make setup     First-time setup: install, copy env examples, migrate, seed"
	@echo "  make migrate   Run Prisma migrations (development)"
	@echo "  make generate  Regenerate Prisma client (after schema changes)"
	@echo "  make seed      Load sample host, event types, availability, bookings"
	@echo "  make run       Start backend + frontend dev servers (parallel)"
	@echo "  make backend   Start API only (http://localhost:4000)"
	@echo "  make frontend  Start UI only (http://localhost:3000)"
	@echo "  make stop      Stop running dev servers"
	@echo "  make fix-ui    Clear .next cache and restart frontend (fixes broken CSS/404 chunks)"
	@echo "  make build     Production build (backend + frontend)"
	@echo "  make clean     Remove .next cache and compiled backend output"

install:
	cd $(BACKEND_DIR) && npm install
	cd $(FRONTEND_DIR) && npm install

setup: install
	@test -f $(BACKEND_DIR)/.env || cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env
	@test -f $(FRONTEND_DIR)/.env.local || cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env.local
	@echo ""
	@echo "Edit backend/.env and frontend/.env.local with your Neon + local URLs, then run:"
	@echo "  make migrate && make seed && make run"
	@echo ""

migrate:
	cd $(BACKEND_DIR) && npx prisma migrate dev

generate:
	cd $(BACKEND_DIR) && npx prisma generate

seed:
	cd $(BACKEND_DIR) && npx prisma db seed

run: dev

dev:
	@echo "Starting backend (http://localhost:4000) and frontend (http://localhost:3000)..."
	@echo "Press Ctrl+C to stop both."
	@$(MAKE) -j2 backend frontend

backend:
	cd $(BACKEND_DIR) && npm run dev

frontend:
	cd $(FRONTEND_DIR) && npm run dev

stop:
	-pkill -f "next dev" 2>/dev/null || true
	-pkill -f "tsx watch src/index.ts" 2>/dev/null || true
	@echo "Dev servers stopped."

fix-ui: stop
	rm -rf $(FRONTEND_DIR)/.next
	@echo "Cleared frontend/.next — run: cd frontend && npm run dev"

build:
	cd $(BACKEND_DIR) && npm run build
	cd $(FRONTEND_DIR) && npm run build

clean:
	rm -rf $(FRONTEND_DIR)/.next $(BACKEND_DIR)/dist
	@echo "Cleaned .next and dist/"
