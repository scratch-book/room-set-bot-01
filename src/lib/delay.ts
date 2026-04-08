/**
 * Возвращает Promise, который разрешается через указанное количество миллисекунд.
 * Используется для задержки между первым и вторым сообщением.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
