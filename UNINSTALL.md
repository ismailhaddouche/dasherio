# Desinstalación

> **Advertencia:** Este proceso elimina todos los datos de la aplicación de forma permanente. Haz una copia de seguridad antes de continuar.

## Copia de seguridad previa (recomendado)

```bash
sudo ./backup.sh
```

## Pasos

### 1. Detener y eliminar los contenedores

```bash
docker compose down
```

### 2. Eliminar contenedores, imágenes, volúmenes y redes (purga completa)

```bash
docker compose down --rmi all --volumes --remove-orphans
```

Esto elimina:
- Contenedores: `disherio_backend`, `disherio_frontend`, `disherio_mongo`, `disherio_caddy`
- Imágenes construidas localmente
- Volúmenes: `mongo_data`, `caddy_data`, `caddy_config` (incluye todos los datos de la base de datos)
- Red: `disherio_net`

### 3. Eliminar la carpeta del proyecto

```bash
cd ..
rm -rf disherio
```

## Desinstalación completa en un solo bloque

```bash
cd disherio
docker compose down --rmi all --volumes --remove-orphans
cd ..
rm -rf disherio
```

## Limpiar recursos Docker huérfanos (opcional)

Si quieres limpiar otros recursos Docker no usados en el sistema:

```bash
docker system prune -af --volumes
```

> **Nota:** Este último comando afecta a todos los recursos Docker del sistema, no solo a los de disherio.
