jest.mock('@nestjs-modules/mailer/dist/adapters/handlebars.adapter', () => {
  return { HandlebarsAdapter: jest.fn() };
});
