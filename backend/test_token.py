from dotenv import load_dotenv
import os
from jose import jwt

load_dotenv()
secret = os.getenv('SUPABASE_JWT_SECRET')

# paste your full token between the triple quotes
token = """eyJhbGciOiJFUzI1NiIsImtpZCI6IjU3ZjdjMmYwLTE0ZjYtNGFmOS04NzJjLWQ5ZWFhNGM2ZmYxYSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3ZvY3hyYmNvdnRnZGVzaXhocW9iLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxODFiZTZlNy1lYzMwLTRmMGEtOTg0NS04MjA4MGZmNmJhMTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgzODc0ODkwLCJpYXQiOjE3ODM4NzEyOTAsImVtYWlsIjoiYXNtaXRhZ3VwdGEyMTdAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFzbWl0YWd1cHRhMjE3QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjE4MWJlNmU3LWVjMzAtNGYwYS05ODQ1LTgyMDgwZmY2YmExNCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc4Mzg1NDU1OX1dLCJzZXNzaW9uX2lkIjoiNTBiYjA1Y2QtZWM4OS00NTYyLTk1ZDktMzY2MWVjOTMyNWFhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.IU-1cV6JXZ8-MqxAb2uT8p2-xOr-EcpJXM8g2prYFLgM93qxGH5XpRxL7OFfBmt2CbupiF5wXnwXoVNZ8wACZg"""

token = token.strip().replace('\n', '').replace(' ', '')

try:
    payload = jwt.decode(token, secret, algorithms=['HS256'], options={'verify_aud': False})
    print('SUCCESS')
    print('user_id:', payload.get('sub'))
except Exception as e:
    print('ERROR:', e)