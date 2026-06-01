import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        console.log('CLICOU NO LOGIN');

        if (!email || !password) {

            alert('Preencha email e senha');

            return;
        }

        try {

            setLoading(true);

            const response = await api.post(
                '/auth/login',
                {
                    email,
                    password
                }
            );

            console.log('RESPOSTA:', response.data);

            const { token, user } = response.data;

            if (!token) {

                throw new Error('Token não recebido');
            }

            // SALVA DADOS
            localStorage.setItem('token', token);

            localStorage.setItem(
                'user',
                JSON.stringify(user)
            );

            // FEEDBACK
            alert('Login realizado com sucesso 🚀');

            // REDIRECIONA
            navigate('/dashboard');

        } catch (error) {

            console.log('ERRO COMPLETO:', error);

            console.log(
                'RESPOSTA:',
                error.response?.data
            );

            if (
                error.response?.status === 400 ||
                error.response?.status === 401
            ) {

                alert('Email ou senha inválidos');

            } else {

                alert('Erro ao conectar com o servidor');
            }

        } finally {

            setLoading(false);
        }
    };

    return (

        <div
            style={{
                padding: '40px',
                textAlign: 'center'
            }}
        >

            <h1>Login</h1>

            <form onSubmit={handleLogin}>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <br /><br />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Entrando...'
                        : 'Entrar'}
                </button>

            </form>

        </div>
    );
}

export default Login;