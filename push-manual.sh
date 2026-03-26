#!/bin/bash
# =============================================================================
# DisherIO - Push Manual
# Ejecutar este script para hacer push de los cambios a GitHub
# =============================================================================

echo "DisherIO - Push de cambios a GitHub"
echo "===================================="
echo ""
echo "Commits pendientes de push:"
git log origin/main..HEAD --oneline
echo ""
echo "Para hacer push, ejecuta uno de los siguientes metodos:"
echo ""
echo "METODO 1: Usar gh CLI (recomendado)"
echo "  gh auth login"
echo "  git push origin main"
echo ""
echo "METODO 2: Usar token personal"
echo "  git remote set-url origin https://TU_TOKEN@github.com/ismailhaddouche/disherio.git"
echo "  git push origin main"
echo "  git remote set-url origin https://github.com/ismailhaddouche/disherio.git"
echo ""
echo "METODO 3: SSH"
echo "  git remote set-url origin git@github.com:ismailhaddouche/disherio.git"
echo "  git push origin main"
echo ""
