export const arithmetic = `
1 + 2 * 3 - 4 / 5;
`

export const functionCall = `
fun fst (x:int,y:int) = x;
fst(8,9);
`

export const simpleIf = `
fun If (x: bool, y: int, z: int) = if x then y else z;
If(true, 5, 6);
`

export const factorial = `
fun fact (n: int) = if n=0 then 1 else n*fact(n-1);
fact(7);
`

export const fibonacci = `
fun fib (n: int) = if n<2 then n else fib(n-1)+fib(n-2);
fib(10);
`

export const codeSamples = [
  { name: 'Arithmetic', code: arithmetic },
  { name: 'Function call', code: functionCall },
  { name: 'If statement', code: simpleIf },
  { name: 'Factorial', code: factorial },
  { name: 'Fibonacci', code: fibonacci },
];