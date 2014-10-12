import socket
import json
import time
import uuid
import random

playerId = uuid.uuid4().hex
playerNames = ('Roger', 'Joséphine',
               'Gladys', 'Rita',
               'Robin', 'Connie',)

color_red = '\033[91m'
color_green = '\033[92m'
color_end = '\033[0m'

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 34072))

def writeJson(dict):
    return json.dumps(dict).encode('utf8')

def readJson(bytes):
    return json.loads(bytes.decode('utf8'))

def sendJson(sock, dict):
    return sock.send(writeJson(dict))

def receiveJson(sock):
    return readJson(sock.recv(4096))

def decoratedText(str, char):
    border = char * 20
    spaces = ' ' * 2
    return border + spaces + str

def coloredPrint(val, color):
    print(color)
    print(val)
    print(color_end)

def logScenario(str):
    def decorator_fn(func):
        def wrapper_fn(*args, **kwargs):
            print(decoratedText('Start ' + str, '▀'))

            try:
                val = func(*args, **kwargs)
                coloredPrint(val, color_green)
            except ScenarioException as e:
                val = None
                coloredPrint(e, color_red)

            print(decoratedText('End ' + str, '▄'))
            return val
        return wrapper_fn
    return decorator_fn


class ScenarioException(Exception):
    pass

@logScenario('Authenticate with new uuid')
def authenticate():
    sendJson(sock, {
        'action': 'authenticate:user',
        'value': {'id': playerId,
                  'name': random.choice(playerNames)}
    })

    response = receiveJson(sock)
    if response.get('status', None) != 'success':
        raise ScenarioException(
            'Expected response: status == success',
            'Received response: ' + json.dumps(response)
        )
    else:
        return response

@logScenario('Search for a new game')
def searchForAGame():
    sendJson(sock, {
        'action': 'initiate:search:game'
    })

    response = receiveJson(sock)
    if response.get('status', None) != 'success':
        raise ScenarioException(
            'Expected response: status == success',
            'Received response: ' + json.dumps(response)
        )
    else:
        return response

@logScenario('Select characters')
def selectCharacters(characters):
    sendJson(sock, {
        'action': 'set:characters',
        'value': {'characters': characters}
    })

    response = receiveJson(sock)
    if response.get('status', None) != 'success':
        raise ScenarioException(
            'Expected response: status == success',
            'Received response: ' + json.dumps(response)
        )
    else:
        return response

@logScenario('What is the current game state ?')
def getCurrentGameState():
    sendJson(sock, {
        'action': 'get:gamestate'
    })

    response = receiveJson(sock)
    if response.get('status', None) != 'success':
        raise ScenarioException(
            'Expected response: status == success',
            'Received response: ' + json.dumps(response)
        )
    else:
        return response

@logScenario('Choose a commande to perform')
def chooseCommande(sourceChar, targetChar, opponentId):
    sendJson(sock, {
        'action': 'set:commande',
        'value': {
            'commande': {
                'event': 'attack',
                'sourceCharacter': sourceChar,
                'targetCharacter': targetChar,
                'targetPlayer': opponentId
            }
        }
    })

    response = receiveJson(sock)
    if response.get('status', None) != 'success':
        raise ScenarioException(
            'Expected response: status == success',
            'Received response: ' + json.dumps(response)
        )
    else:
        return response

def main():
    authenticate()

    res = searchForAGame()
    value = res.get('value', {})
    allCharacters, opponent = value.get('allCharacters'), value.get('opponent')
    char = random.choice(allCharacters)['id']

    value = selectCharacters([char]).get('value')
    opponents = [player for player in value.get('players') if player['id'] != playerId]

    opponent = random.choice(opponents)
    opponentId = opponent['id']
    targetChar = random.choice(opponent['characters'])['id']

    while getCurrentGameState()['value']['isRunning']:
        chooseCommande(char, targetChar, opponentId)
main()
