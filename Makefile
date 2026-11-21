PORT ?= 3000
BASE ?= http://localhost:$(PORT)

.PHONY: test dev check deploy

test:            ## unit tests (no network)
	npm test

dev:             ## local addon server on $(PORT)
	PORT=$(PORT) npm run dev

check:           ## smoke-check a running addon (local or BASE=https://...)
	BASE=$(BASE) ./scripts/check.sh

deploy:          ## production deploy to Vercel
	npx vercel --prod
