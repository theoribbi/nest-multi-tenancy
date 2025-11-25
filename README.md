# Nest Multi Tenancy with Drizzle ORM

## Overview
This project is a starter template for people that want to create a backend managing multi tenancy dynamicly by using Postgres Schema.

## Technology used
  - [NestJS](https://nestjs.com/)
  - [Drizzle ORM](https://orm.drizzle.team/)
  - [Scalar](https://scalar.com/)
  - [Docker](https://www.docker.com/)

## Postgres Dynamic Schema with Drizzle ORM
Drizzle ORM do not support officialy dynamic multi tenant support. See the docs [here](https://orm.drizzle.team/docs/sql-schema-declaration#schemas).

So the goal of this project is to separate the *"public"* schema on the drizzle-kit management and the *"tenant"* schema on the JS runtime.

Thanks to the Github discussion that helped me a lot:
  - [[BUG]: design: working with dynamic schemas is practically impossible #423](https://github.com/drizzle-team/drizzle-orm/issues/1807)
  - [[FEATURE]: Dynamic Schema #1807](https://github.com/drizzle-team/drizzle-orm/issues/1807)

## Get Started
First of all you need [pnpm](https://pnpm.io/fr/) and [docker-compose](https://docs.docker.com/compose/) installed on your machine.

1. Clone the project 
```bash 
https://github.com/theoribbi/nest-multi-tenancy.git
```
2. Launch Docker Containers
```bash 
docker-compose up --build
```

3. Generate and execute public migration
```bash
# TTY to app container
docker exec -it nest-multi-tenancy-app sh

# Generate migration for both public and tenant schema
pnpm run db:generate

# Appliquate migration just for public sche,a
pnpm run db:migrate
```

After that you can test to create multiple company, run tenant migration (on the JS runtime) and create user on each schema `http://localhost:3000/`

Drizzle Studio Gateway is setup on `http://localhost:4983/` and you can see the result of your schema creation from here.

## Contribution
If you have some question or want to contribute you are free to help !
