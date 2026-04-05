#!/usr/bin/env bash
set -e

echo "===== backup defensivo ====="
cp -n package.json package.json.bak 2>/dev/null || true
cp -n tsconfig.json tsconfig.json.bak 2>/dev/null || true
cp -n tsconfig.spec.json tsconfig.spec.json.bak 2>/dev/null || true
cp -n jest.config.js jest.config.js.bak 2>/dev/null || true

echo "===== criando tsconfig.json ====="
cat > tsconfig.json <<'EOT'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "outDir": "./dist",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "prisma/**/*.ts"],
  "exclude": ["node_modules", "dist", "test"]
}
EOT

echo "===== criando tsconfig.spec.json ====="
cat > tsconfig.spec.json <<'EOT'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"]
  },
  "include": [
    "src/**/*.ts",
    "test/**/*.ts",
    "**/*.spec.ts"
  ]
}
EOT

echo "===== criando jest.config.js ====="
cat > jest.config.js <<'EOT'
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage'
};
EOT

echo "===== ajustando script test no package.json ====="
python3 - <<'PY'
import json
from pathlib import Path

p = Path("package.json")
data = json.loads(p.read_text())
data["scripts"]["test"] = "jest --config ./jest.config.js"
p.write_text(json.dumps(data, indent=2) + "\n")
print("package.json atualizado com sucesso")
PY

echo "===== arquivos criados ====="
ls -la tsconfig.json tsconfig.spec.json jest.config.js fix-jest.sh

echo "===== teste focal ====="
pnpm test -- appointment-blocks.service.spec.ts