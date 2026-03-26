# ADR-002: Patrón Repository vs Service

## Status
Accepted

## Context
Actualmente la lógica de acceso a datos está mezclada con lógica de negocio en los servicios. Esto dificulta:
- Testing (necesita MongoDB real)
- Cambiar la base de datos
- Reutilizar lógica de negocio

## Decision
Implementar **Repository Pattern** con las siguientes reglas:

### Capa Repository (Acceso a Datos)
```typescript
// repositories/interfaces/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// repositories/implementations/user.repository.mongo.ts
export class UserRepositoryMongo implements IUserRepository {
  constructor(private readonly model: Model<UserDocument>) {}
  
  async findById(id: string): Promise<User | null> {
    // BUG-01 fix: Validar ObjectId antes de usar
    if (!isValidObjectId(id)) {
      throw new ValidationError('Invalid user ID format');
    }
    return this.model.findById(id).lean();
  }
  // ...
}
```

### Capa Service (Lógica de Negocio)
```typescript
// services/auth.service.ts
export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly logger: ILogger
  ) {}
  
  async login(email: string, password: string): Promise<AuthResult> {
    // Solo lógica de negocio, no queries directas
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedError('Invalid credentials');
    }
    // ...
  }
}
```

### Reglas de Oro
1. **Repositories solo hacen queries** - No lógica de negocio
2. **Services no acceden a modelos directamente** - Usan repositories
3. **Validaciones de entrada van en middleware** - Zod schemas
4. **Validaciones de negocio van en services** - Duplicados, estado, etc.
5. **Controladores solo orquestan** - 5 líneas máximo por método

### Inyección de Dependencias
```typescript
// config/container.ts (simple DI sin frameworks pesados)
export const container = {
  userRepository: new UserRepositoryMongo(UserModel),
  authService: new AuthService(
    container.userRepository,
    container.jwtService,
    container.logger
  )
};

// controllers/auth.controller.ts
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  async login(req: Request, res: Response) {
    const result = await this.authService.login(req.body.email, req.body.password);
    res.json(result);
  }
}
```

## Consequences

### Positive
- Testing: podemos mockear repositories fácilmente
- Cambio de BD: solo reimplementamos repositories
- Código más limpio y testable

### Negative
- Más archivos (interfaces + implementaciones)
- Necesita inyección de dependencias

## References
- Repository Pattern - Martin Fowler
- Dependency Inversion Principle (SOLID)
