Vue.component('todo-item', {
    template: '\
<li>\
{{ title }}\
<button v-on:click="$emit(\'remove\')">Удалить</button>\
</li>\
',
    props: ['title']
});

Vue.component('columns', {
    template: `
        <div class="columns">
            <column title="Первый столбец" :cards="firstColumn" @add-card="addCard('firstColumn', $event)" @remove-card="removeCard('firstColumn', $event)"></column>
            <column title="Второй столбец" :cards="secondColumn" @add-card="addCard('secondColumn', $event)" @remove-card="removeCard('secondColumn', $event)"></column>
            <column title="Третий столбец" :cards="thirdColumn" @add-card="addCard('thirdColumn', $event)" @remove-card="removeCard('thirdColumn', $event)"></column>
        </div>
        `,
    data() {
        return {
            firstColumn: [],
            secondColumn: [],
            thirdColumn: []
        }
    },
    created() {
        this.loadFromLocalStorage();
    },
    methods: {
        addCard(column, customTitle) {
            if (column === 'firstColumn' && this.firstColumn.length >= 3) {
                alert('Достигнуто максимальное количество карточек в первом столбце.');
                return;
            }
            if (column === 'secondColumn' && this.secondColumn.length >= 5) {
                alert('Достигнуто максимальное количество карточек во втором столбце.');
                return;
            }
            const newCard = { title: customTitle || 'Новая заметка', items: [{ text: '', completed: false }] };
            this[column].push(newCard);
            this.saveToLocalStorage();
        },
        removeCard(column, cardIndex) {
            this[column].splice(cardIndex, 1);
            this.saveToLocalStorage();
        },
        saveToLocalStorage() {
            localStorage.setItem('todo-columns', JSON.stringify({
                firstColumn: this.firstColumn,
                secondColumn: this.secondColumn,
                thirdColumn: this.thirdColumn
            }));
        },
        loadFromLocalStorage() {
            const data = JSON.parse(localStorage.getItem('todo-columns'));
            if (data) {
                this.firstColumn = data.firstColumn || [];
                this.secondColumn = data.secondColumn || [];
                this.thirdColumn = data.thirdColumn || [];
            }
        }
    }
});

Vue.component('column', {
    props: ['title', 'cards'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card v-for="(card, index) in cards" :key="index" :title="card.title" :items="card.items" @remove="removeCard(index)"></card>
            <button @click="addCardWithCustomTitle">Добавить заметку</button>
        </div>
        `,
    methods: {
        removeCard(cardIndex) {
            this.$emit('remove-card', cardIndex);
        },
        addCardWithCustomTitle() {
            const customTitle = prompt('Введите заголовок для новой заметки:');
            if (customTitle) {
                this.$emit('add-card', customTitle);
            }
        }
    }
});

Vue.component('card', {
    props: ['title', 'items'],
    template: `
        <div class="card">
            <h3>{{ title }}</h3>
            <ul>
                <list-item v-for="(item, index) in items" :key="index" :item="item" @toggle-complete="toggleComplete(index)"></list-item>
            </ul>
            <button @click="addItem">Добавить пункт</button>
            <button @click="remove">Удалить заметку</button>
        </div>
        `,
    methods: {
        addItem() {
            this.items.push({ text: '', completed: false });
        },
        remove() {
            this.$emit('remove');
        },
        toggleComplete(index) {
            this.items[index].completed = !this.items[index].completed;
        }
    }
});

Vue.component('list-item', {
    props: ['item'],
    template: `
        <li>
            <input type="checkbox" v-model="item.completed" @change="$emit('toggle-complete')">
            <span :class="{ completed: item.completed }">{{ item.text }}</span>
        </li>
        `
});

new Vue({
    el: '#app'
});
