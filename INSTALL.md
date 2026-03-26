# Instalación

## Requisitos

- Sistema operativo: Ubuntu / Debian
- Acceso root o usuario con `sudo`
- Conexión a internet

## Pasos

### 1. Clonar el repositorio

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
```

### 2. Dar permisos al instalador

```bash
chmod +x scripts/install.sh
```

### 3. Ejecutar el instalador

```bash
sudo ./scripts/install.sh
```

El instalador te guiará por los siguientes pasos:

- Selección de idioma
- Instalación de dependencias (Docker, UFW, curl)
- Modo de red:
  - Dominio público con HTTPS (Let's Encrypt)
  - Dominio local
  - IP pública
  - IP local
- Generación de contraseña de administrador
- Construcción e inicio de contenedores
- Carga de datos iniciales (seed)
- Comprobación de salud

Al finalizar se mostrará la URL de acceso y las credenciales de administrador.

## Scripts adicionales

| Script | Descripción |
|---|---|
| `sudo ./scripts/configure.sh` | Reconfigurar red, dominio, contraseña o idioma |
| `sudo ./scripts/backup.sh` | Crear copia de seguridad de la base de datos |
| `sudo ./scripts/restart.sh` | Reiniciar todos los servicios |
| `sudo ./scripts/info.sh` | Ver IP, dominio, DNS y estado de los contenedores |
