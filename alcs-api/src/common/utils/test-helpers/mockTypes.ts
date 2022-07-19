import {
  KEYCLOAK_CONNECT_OPTIONS,
  KEYCLOAK_INSTANCE,
  KEYCLOAK_LOGGER,
} from 'nest-keycloak-connect';
import { KeycloakMultiTenantService } from 'nest-keycloak-connect/services/keycloak-multitenant.service';
import { Repository } from 'typeorm';
import { UserService } from '../../../user/user.service';

export type MockType<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]?: jest.Mock<{}>;
};

export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  () => ({
    findOne: jest.fn((entity) => entity),
    save: jest.fn((entity) => entity),
    find: jest.fn((entity) => [entity]),
    update: jest.fn((entity) => [entity]),
    softRemove: jest.fn((entity) => [entity]),
  }),
);

export const mockKeyCloakProviders = [
  {
    provide: KEYCLOAK_INSTANCE,
    useValue: {},
  },
  {
    provide: KEYCLOAK_CONNECT_OPTIONS,
    useValue: {},
  },
  {
    provide: KEYCLOAK_LOGGER,
    useValue: {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      log: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      debug: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      warn: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    },
  },
  KeycloakMultiTenantService,
  {
    provide: UserService,
    useValue: {},
  },
];
