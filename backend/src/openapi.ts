export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Selasar REST API',
    version: '1.4.0',
    description: 'API Selasar untuk tempat nugas, komunitas, autentikasi, bookmark, check-in, dan storage.',
  },
  servers: [{ url: '/api', description: 'Current deployment' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': { get: { summary: 'API health', responses: { '200': { description: 'API online' } } } },
    '/places': {
      get: {
        summary: 'List places',
        parameters: [
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'mood', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string', maxLength: 120 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['rating', 'popular', 'match'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, maximum: 10000, default: 0 } },
        ],
        responses: { '200': { description: 'Paginated place list' } },
      },
    },
    '/places/{id}': {
      get: {
        summary: 'Place detail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Place detail' }, '404': { description: 'Place not found' } },
      },
    },
    '/reviews/place/{placeId}': {
      get: {
        summary: 'List place reviews',
        parameters: [
          { name: 'placeId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['latest', 'highest', 'lowest', 'helpful'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, maximum: 10000 } },
        ],
        responses: { '200': { description: 'Reviews and community metrics' } },
      },
    },
    '/reviews': {
      post: {
        summary: 'Create or update the authenticated user review',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Review saved' }, '401': { description: 'Authentication required' } },
      },
    },
    '/reviews/{id}': {
      delete: {
        summary: 'Soft-hide an owned review',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Review removed' }, '404': { description: 'Review not found or not owned' } },
      },
    },
    '/reviews/{id}/helpful': {
      put: { summary: 'Mark review helpful', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Vote saved' } } },
      delete: { summary: 'Remove helpful vote', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Vote removed' } } },
    },
    '/bookmarks': {
      get: { summary: 'Legacy bookmark collection endpoint', responses: { '200': { description: 'Bookmarks' } } },
    },
    '/bookmarks/{placeId}': {
      put: { summary: 'Create or update bookmark', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Bookmark saved' } } },
      delete: { summary: 'Remove bookmark', security: [{ bearerAuth: [] }], responses: { '204': { description: 'Bookmark removed' } } },
    },
    '/checkins/current': {
      delete: { summary: 'End the authenticated users active check-in', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Check-out completed' }, '404': { description: 'No active check-in' } } },
    },
    '/auth/session': {
      post: { summary: 'Exchange Firebase token for API session', responses: { '200': { description: 'Session created' }, '403': { description: 'Account unavailable' } } },
      delete: { summary: 'Revoke current API session', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Session revoked' } } },
    },
    '/users/me': {
      get: { summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Current user profile' } } },
      patch: { summary: 'Update current user profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Profile updated' } } },
      delete: { summary: 'Delete current user account', security: [{ bearerAuth: [] }], responses: { '204': { description: 'Account deleted' } } },
    },
  },
};
