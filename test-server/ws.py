from app import get_app
from superdesk.ws import create_server

if __name__ == '__main__':
    app = get_app()
    create_server(app.config)
