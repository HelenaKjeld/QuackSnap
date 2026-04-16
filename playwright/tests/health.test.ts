import { test, expect } from '@playwright/test';

test ( "health check", async ({ request }) => {
    
    const response = await request.get("/api/");
    expect(response.status()).toBe(200);
});