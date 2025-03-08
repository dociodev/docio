import { relations } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const Installation = pgTable('Installation', {
  id: integer('id').notNull().primaryKey(),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
});

export const Repository = pgTable('Repository', {
  id: integer('id').notNull().primaryKey(),
  name: text('name').notNull(),
  fullName: text('fullName').notNull(),
  private: boolean('private').notNull(),
  defaultBranch: text('defaultBranch').notNull().default('main'),
  installationId: integer('installationId').notNull(),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
}, (Repository) => ({
  'Repository_installation_fkey': foreignKey({
    name: 'Repository_installation_fkey',
    columns: [Repository.installationId],
    foreignColumns: [Installation.id],
  })
    .onDelete('cascade')
    .onUpdate('cascade'),
}));

export const Domain = pgTable('Domain', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull().unique(),
  isVerified: boolean('isVerified').notNull(),
  isDocioDomain: boolean('isDocioDomain').notNull(),
  dnsRecordId: text('dnsRecordId'),
  repositoryId: integer('repositoryId').notNull(),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
}, (Domain) => ({
  'Domain_repository_fkey': foreignKey({
    name: 'Domain_repository_fkey',
    columns: [Domain.repositoryId],
    foreignColumns: [Repository.id],
  })
    .onDelete('cascade')
    .onUpdate('cascade'),
}));

export const Task = pgTable('Task', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull(),
  repositoryId: integer('repositoryId').notNull(),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
}, (Task) => ({
  'Task_repository_fkey': foreignKey({
    name: 'Task_repository_fkey',
    columns: [Task.repositoryId],
    foreignColumns: [Repository.id],
  })
    .onDelete('cascade')
    .onUpdate('cascade'),
}));

export const InstallationRelations = relations(Installation, ({ many }) => ({
  repositories: many(Repository, {
    relationName: 'InstallationToRepository',
  }),
}));

export const RepositoryRelations = relations(Repository, ({ one, many }) => ({
  installation: one(Installation, {
    relationName: 'InstallationToRepository',
    fields: [Repository.installationId],
    references: [Installation.id],
  }),
  domains: many(Domain, {
    relationName: 'DomainToRepository',
  }),
  tasks: many(Task, {
    relationName: 'RepositoryToTask',
  }),
}));

export const DomainRelations = relations(Domain, ({ one }) => ({
  repository: one(Repository, {
    relationName: 'DomainToRepository',
    fields: [Domain.repositoryId],
    references: [Repository.id],
  }),
}));

export const TaskRelations = relations(Task, ({ one }) => ({
  repository: one(Repository, {
    relationName: 'RepositoryToTask',
    fields: [Task.repositoryId],
    references: [Repository.id],
  }),
}));
