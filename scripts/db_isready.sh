#!/usr/bin/env bash
#
# Usage @POSTGRES_CONTAINER_NAME=$(docker inspect -f '{{{{.Name}}' $(docker-compose ps -q postgres) | cut -c2-) ./tools/db_isready.sh
# https://stackoverflow.com/a/55990412/13440079
# Or just give the container a name

RETRIES=5

until
	docker exec $POSTGRES_CONTAINER_NAME pg_isready -t 5 -h localhost -p $PG_PORT -U $PG_USER -d $PG_DB >/dev/null 2>&1
do
	if [ $RETRIES -le 0 ]; then
		echo "Postgres is not up - exiting"
		exit 1
	fi
	echo "Waiting for postgres server, $RETRIES remaining attempts..."
	RETRIES=$((RETRIES - 1))
	sleep 5
done
