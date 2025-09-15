/// <reference types="jest" />
/// <reference types="@types/jest" />

declare global {
  var jest: typeof import('jest');
  var expect: jest.Expect;
  var test: jest.It;
  var it: jest.It;
  var describe: jest.Describe;
  var beforeAll: jest.Lifecycle;
  var beforeEach: jest.Lifecycle;
  var afterAll: jest.Lifecycle;
  var afterEach: jest.Lifecycle;
}

export {};