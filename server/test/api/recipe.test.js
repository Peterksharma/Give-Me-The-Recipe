const request = require('supertest');
const nock = require('nock');
const app = require('../../server');

describe('Recipe API Endpoints', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    describe('POST /api/extract-recipe', () => {
        it('should extract recipe title successfully', async () => {
            const mockHtml = `
                <html>
                    <head><title>Chocolate Chip Cookies</title></head>
                    <body>
                        <h1>Chocolate Chip Cookies</h1>
                        <p>Delicious homemade cookies</p>
                    </body>
                </html>
            `;

            nock('https://example.com')
                .get('/recipe')
                .reply(200, mockHtml);

            const response = await request(app)
                .post('/api/extract-recipe')
                .send({ url: 'https://example.com/recipe' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.title).toBe('Chocolate Chip Cookies');
        });

        it('should return error for missing URL', async () => {
            const response = await request(app)
                .post('/api/extract-recipe')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('URL is required');
        });

        it('should return error for invalid URL', async () => {
            nock('https://invalid-url.com')
                .get('/')
                .replyWithError('ENOTFOUND');

            const response = await request(app)
                .post('/api/extract-recipe')
                .send({ url: 'https://invalid-url.com' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to extract recipe title');
        });
    });

    describe('POST /api/extract-ingredients', () => {
        it('should extract ingredients from Navajo Fry Bread recipe', async () => {
            const mockHtml = `
                <html>
                    <head><title>Navajo Fry Bread</title></head>
                    <body>
                        <h1>Navajo Fry Bread</h1>
                        <h2>Ingredients</h2>
                        <ul>
                            <li>2 cups oil for frying</li>
                            <li>4 cups all-purpose flour</li>
                            <li>3 tablespoons baking powder</li>
                            <li>2 teaspoons salt</li>
                            <li>2 ½ cups warm milk</li>
                        </ul>
                        <h2>Directions</h2>
                        <ol>
                            <li>Heat oil in a deep fryer or large saucepan to 375 degrees F (190 degrees C).</li>
                            <li>Combine flour, baking powder, and salt in a large bowl; mix in milk to form a soft dough.</li>
                        </ol>
                    </body>
                </html>
            `;

            nock('https://example.com')
                .get('/navajo-fry-bread')
                .reply(200, mockHtml);

            const response = await request(app)
                .post('/api/extract-ingredients')
                .send({ url: 'https://example.com/navajo-fry-bread' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.ingredients).toHaveLength(5);
            expect(response.body.ingredients).toContain('2 cups oil for frying');
            expect(response.body.ingredients).toContain('4 cups all-purpose flour');
            expect(response.body.ingredients).toContain('3 tablespoons baking powder');
            expect(response.body.ingredients).toContain('2 teaspoons salt');
            expect(response.body.ingredients).toContain('2 1/2 cups warm milk');
        });

        it('should return error for missing URL', async () => {
            const response = await request(app)
                .post('/api/extract-ingredients')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('URL is required');
        });
    });

    describe('POST /api/extract-instructions', () => {
        it('should extract instructions from Navajo Fry Bread recipe', async () => {
            const mockHtml = `
                <html>
                    <head><title>Navajo Fry Bread</title></head>
                    <body>
                        <h1>Navajo Fry Bread</h1>
                        <h2>Ingredients</h2>
                        <ul>
                            <li>2 cups oil for frying</li>
                            <li>4 cups all-purpose flour</li>
                        </ul>
                        <h2>Directions</h2>
                        <ol>
                            <li>Heat oil in a deep fryer or large saucepan to 375 degrees F (190 degrees C).</li>
                            <li>Combine flour, baking powder, and salt in a large bowl; mix in milk to form a soft dough.</li>
                            <li>Lower dough rounds, about 3 or 4 at a time, carefully into hot oil.</li>
                        </ol>
                    </body>
                </html>
            `;

            nock('https://example.com')
                .get('/navajo-fry-bread')
                .reply(200, mockHtml);

            const response = await request(app)
                .post('/api/extract-instructions')
                .send({ url: 'https://example.com/navajo-fry-bread' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.instructions).toHaveLength(3);
            expect(response.body.instructions[0]).toContain('Heat oil in a deep fryer');
            expect(response.body.instructions[1]).toContain('Combine flour, baking powder');
            expect(response.body.instructions[2]).toContain('Lower dough rounds');
        });

        it('should return error for missing URL', async () => {
            const response = await request(app)
                .post('/api/extract-instructions')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('URL is required');
        });
    });
}); 